import { Router } from "express";
import { db } from "../db/client";
import { getTemporalClient } from "../lib/temporalClient";

const router = Router();

const DEMO_CUSTOMER_ID = "d3b07384-d113-41c3-a309-8809c916298b";
const DEFAULT_EXECUTION_SOURCE_TYPES = ["google_aio", "gemini", "chatgpt", "claude"] as const;

async function getExecutionSources() {
    const result = await db.query(
        `
        SELECT id, type
        FROM sources
        WHERE type = ANY($1::text[])
        ORDER BY CASE type
            WHEN 'google_aio' THEN 0
            WHEN 'gemini' THEN 1
            WHEN 'chatgpt' THEN 2
            WHEN 'claude' THEN 3
            ELSE 99
        END
        `,
        [DEFAULT_EXECUTION_SOURCE_TYPES]
    );
    return result.rows as Array<{ id: string; type: string }>;
}

function getClientIp(req: any): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        const parts = typeof forwarded === "string" ? forwarded.split(",") : forwarded;
        if (parts.length > 0) return parts[0].trim();
    }
    return req.socket.remoteAddress || "127.0.0.1";
}

/**
 * POST /demo/session
 * Checks limits and returns a new session_id
 */
router.post("/session", async (req, res) => {
    const ip = getClientIp(req);

    try {
        // 1. Check daily global limit
        const dailyCapRes = await db.query(
            "SELECT count FROM demo_daily_cap WHERE day = CURRENT_DATE"
        );
        const dailyCount = dailyCapRes.rows[0]?.count || 0;
        if (dailyCount >= 50) {
            return res.status(429).json({ error: "daily_demo_cap_exceeded" });
        }

        // 2. Check IP-based session limit
        const ipSessionsRes = await db.query(
            "SELECT COUNT(*)::int AS count FROM demo_sessions WHERE ip_address = $1",
            [ip]
        );
        const ipCount = ipSessionsRes.rows[0].count;
        if (ipCount >= 2) {
            return res.status(429).json({ error: "demo_limit_reached" });
        }

        // 3. Create demo session record
        const sessionRes = await db.query(
            `
            INSERT INTO demo_sessions (ip_address)
            VALUES ($1)
            RETURNING id
            `,
            [ip]
        );

        // 4. Increment daily counter
        await db.query(
            `
            INSERT INTO demo_daily_cap (day, count)
            VALUES (CURRENT_DATE, 1)
            ON CONFLICT (day)
            DO UPDATE SET count = demo_daily_cap.count + 1
            `
        );

        res.status(201).json({ session_id: sessionRes.rows[0].id });
    } catch (err) {
        console.error("Failed to create demo session:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /demo/brand
 * Register one brand for the demo session
 */
router.post("/brand", async (req, res) => {
    const { session_id, brand_name, description } = req.body;

    if (!session_id || !brand_name) {
        return res.status(400).json({ error: "session_id and brand_name are required" });
    }

    try {
        // Verify session exists
        const sessionCheck = await db.query("SELECT id, brand_id FROM demo_sessions WHERE id = $1", [session_id]);
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (sessionCheck.rows[0].brand_id) {
            return res.status(400).json({ error: "Brand already registered for this session" });
        }

        const canonicalUrls = [`https://${brand_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`];

        const brandRes = await db.query(
            `
            INSERT INTO brands (customer_id, brand_name, canonical_urls, description, logo_url, competitors)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [DEMO_CUSTOMER_ID, brand_name, canonicalUrls, description || "", "", []]
        );

        const brand = brandRes.rows[0];

        // Link brand to demo session
        await db.query(
            "UPDATE demo_sessions SET brand_id = $1 WHERE id = $2",
            [brand.id, session_id]
        );

        res.status(201).json(brand);
    } catch (err) {
        console.error("Failed to create demo brand:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /demo/queries
 * Create at max 2 queries for the demo brand
 */
router.post("/queries", async (req, res) => {
    const { session_id, brand_id, queries } = req.body;

    if (!session_id || !brand_id || !Array.isArray(queries)) {
        return res.status(400).json({ error: "session_id, brand_id and queries array are required" });
    }

    if (queries.length === 0 || queries.length > 2) {
        return res.status(400).json({ error: "You can create at most 2 queries" });
    }

    try {
        // Verify session ownership
        const sessionCheck = await db.query("SELECT id, brand_id FROM demo_sessions WHERE id = $1", [session_id]);
        if (sessionCheck.rows.length === 0 || sessionCheck.rows[0].brand_id !== brand_id) {
            return res.status(403).json({ error: "Invalid session or brand mismatch" });
        }

        const createdQueries = [];
        for (const q of queries) {
            const { query_text, query_type } = q;
            if (!query_text || !query_type) {
                return res.status(400).json({ error: "query_text and query_type are required for each query" });
            }

            const queryRes = await db.query(
                `
                INSERT INTO queries (customer_id, brand_id, query_text, query_type, frequency, is_active)
                VALUES ($1, $2, $3, $4, 'manual', false)
                RETURNING *
                `,
                [DEMO_CUSTOMER_ID, brand_id, query_text, query_type]
            );
            createdQueries.push(queryRes.rows[0]);
        }

        res.status(201).json(createdQueries);
    } catch (err) {
        console.error("Failed to create demo queries:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /demo/run
 * Run queries exactly once
 */
router.post("/run", async (req, res) => {
    const { session_id } = req.body;

    if (!session_id) {
        return res.status(400).json({ error: "session_id is required" });
    }

    try {
        const sessionCheck = await db.query("SELECT id, brand_id, has_run FROM demo_sessions WHERE id = $1", [session_id]);
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const { brand_id, has_run } = sessionCheck.rows[0];
        if (!brand_id) {
            return res.status(400).json({ error: "Register a brand first" });
        }

        if (has_run) {
            return res.status(400).json({ error: "Demo run already executed for this session" });
        }

        // Get execution sources
        const sources = await getExecutionSources();
        if (sources.length === 0) {
            return res.status(500).json({ error: "No execution sources configured" });
        }

        // Get queries to run
        const queriesRes = await db.query(
            "SELECT id FROM queries WHERE brand_id = $1 AND customer_id = $2 AND is_deleted = FALSE",
            [brand_id, DEMO_CUSTOMER_ID]
        );

        if (queriesRes.rows.length === 0) {
            return res.status(400).json({ error: "No queries configured for this demo brand" });
        }

        const temporal = await getTemporalClient();
        const workflowIds = [];

        for (const query of queriesRes.rows) {
            const handle = await temporal.workflow.start("querySchedulerWorkflow", {
                taskQueue: "asvp-query-scheduler",
                workflowId: `demo-query-${query.id}-${Date.now()}`,
                args: [
                    {
                        queryId: query.id,
                        sourceIds: sources.map((s) => s.id),
                        customer_id: DEMO_CUSTOMER_ID,
                        brand_id: brand_id,
                        trigger_type: "manual",
                    },
                ],
            });
            workflowIds.push(handle.workflowId);
        }

        // Mark session as run
        await db.query("UPDATE demo_sessions SET has_run = true WHERE id = $1", [session_id]);

        res.json({ message: "Workflows started", workflowIds });
    } catch (err) {
        console.error("Failed to run demo workflows:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /demo/results
 * Returns current results for a session
 */
router.get("/results", async (req, res) => {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({ error: "session_id is required" });
    }

    try {
        const sessionCheck = await db.query("SELECT brand_id FROM demo_sessions WHERE id = $1", [session_id]);
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const brandId = sessionCheck.rows[0].brand_id;
        if (!brandId) {
            return res.json({ success: true, data: [] });
        }

        const query = `
        SELECT
            a.execution_group_id,
            a.query_id,
            q.query_text,
            a.brand_id,
            b.brand_name,
            MAX(a.created_at) AS created_at,
            json_agg(
                json_build_object(
                    'id', a.id,
                    'run_id', a.run_id,
                    'source_id', a.source_id,
                    'source_type', s.type,
                    'raw_text', a.raw_text,
                    'created_at', a.created_at,
                    'mentions_brand', a.mentions_brand,
                    'visibility_score', a.visibility_score,
                    'sentiment_label', a.sentiment_label,
                    'sentiment_score', a.sentiment_score,
                    'prominence_score', a.prominence_score,
                    'main_snippet', a.main_snippet,
                    'entities', a.entities
                )
                ORDER BY s.type, a.created_at DESC
            ) AS answers
        FROM answers a
        JOIN queries q ON q.id = a.query_id
        JOIN brands b ON b.id = a.brand_id
        JOIN sources s ON s.id = a.source_id
        WHERE a.customer_id = $1
          AND a.brand_id = $2
        GROUP BY a.execution_group_id, a.query_id, q.query_text, a.brand_id, b.brand_name
        ORDER BY MAX(a.created_at) DESC
        `;

        const result = await db.query(query, [DEMO_CUSTOMER_ID, brandId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Failed to fetch demo results:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /demo/analytics
 * Returns simple aggregate stats for a session (no trends)
 */
router.get("/analytics", async (req, res) => {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({ error: "session_id is required" });
    }

    try {
        const sessionCheck = await db.query("SELECT brand_id FROM demo_sessions WHERE id = $1", [session_id]);
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const brandId = sessionCheck.rows[0].brand_id;
        if (!brandId) {
            return res.status(400).json({ error: "No brand created for this session yet" });
        }

        const statsQuery = `
        SELECT
            AVG(a.visibility_score) AS avg_visibility,
            AVG(a.sentiment_score) AS avg_sentiment,
            AVG(a.prominence_score) AS avg_prominence,
            (
                SUM(CASE WHEN a.mentions_brand = true THEN 1 ELSE 0 END)::float
                / NULLIF(COUNT(a.id),0)
            ) * 100 AS mention_rate,
            COUNT(DISTINCT a.run_id) AS runs_count,
            COUNT(a.id) AS responses_count
        FROM answers a
        WHERE a.customer_id = $1
          AND a.brand_id = $2
        `;

        const result = await db.query(statsQuery, [DEMO_CUSTOMER_ID, brandId]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Failed to fetch demo analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
