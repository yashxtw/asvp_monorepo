import { Router } from "express";
import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { getTemporalClient } from "../lib/temporalClient";
import { frequencyToCron } from "../lib/cron";
import { WorkflowExecutionAlreadyStartedError } from "@temporalio/client";
import { syncPlanExpiry } from "../billing/syncPlanExpiry";

const router = Router();

const MULTI_SOURCE_SCHEDULE_KEY = "multi_source";
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

/**
 * POST /queries
 * body: {
 *   query_text: string,
 *   query_type: "brand" | "category" | "competitor",
 *   frequency?: "daily" | "weekly" | "manual"
 * }
 */
router.post("/", requireAuth, async (req, res) => {
    const { brand_id, query_text, query_type, frequency = "daily" } = req.body;

    if (!brand_id || !query_text || !query_type) {
        return res.status(400).json({ error: "brand_id, query_text and query_type are required" });
    }

    if (!["brand", "category", "competitor"].includes(query_type)) {
        return res.status(400).json({ error: "Invalid query_type" });
    }

    if (!["daily", "weekly", "manual"].includes(frequency)) {
        return res.status(400).json({ error: "Invalid frequency" });
    }

    try {
        const result = await db.query(
            `
        INSERT INTO queries (
            customer_id,
            brand_id,
            query_text,
            query_type,
            frequency
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
            [req.user!.customer_id, brand_id, query_text, query_type, frequency]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /queries?brand_id=&source_type=
 */
router.get("/", requireAuth, async (req, res) => {
    const { brand_id, source_type } = req.query;
    const customerId = req.user!.customer_id;

    try {
        const values: any[] = [customerId];
        const queryFilters: string[] = [
            "q.customer_id = $1",
            "q.is_deleted = FALSE"
        ];
        const sourceFilters: string[] = [
            "r.customer_id = $1"
        ];
        const answerSourceFilters: string[] = [
            "a.customer_id = $1"
        ];

        if (brand_id) {
            values.push(brand_id);
            queryFilters.push(`q.brand_id = $${values.length}`);
            sourceFilters.push(`q.brand_id = $${values.length}`);
            answerSourceFilters.push(`a.brand_id = $${values.length}`);
        }

        if (source_type && typeof source_type === "string") {
            values.push(source_type);
            sourceFilters.push(`s.type = $${values.length}`);
            answerSourceFilters.push(`s.type = $${values.length}`);
        }

        const result = await db.query(
            `
            WITH filtered_runs AS (
                SELECT r.*, s.type AS source_type
                FROM runs r
                JOIN queries q ON q.id = r.query_id
                JOIN sources s ON s.id = r.source_id
                WHERE ${sourceFilters.join(" AND ")}
            ),
            source_breakdown_base AS (
                SELECT
                    a.query_id,
                    s.type AS source_type,
                    COUNT(a.id) AS responses,
                    SUM(CASE WHEN a.mentions_brand THEN 1 ELSE 0 END) AS brand_mentions,
                    COALESCE(ROUND(AVG(a.visibility_score)::numeric, 2), 0) AS visibility,
                    COALESCE(ROUND(AVG(a.prominence_score)::numeric, 2), 0) AS prominence,
                    COALESCE(ROUND(AVG(a.sentiment_score)::numeric, 2), 0) AS sentiment,
                    COUNT(DISTINCT a.run_id) AS runs,
                    MAX(r.started_at) AS last_run
                FROM answers a
                JOIN runs r ON r.id = a.run_id
                JOIN sources s ON s.id = a.source_id
                WHERE ${answerSourceFilters.join(" AND ")}
                GROUP BY a.query_id, s.type
            ),
            run_stats AS (
                SELECT
                    r.query_id,
                    COUNT(*) FILTER (WHERE r.started_at >= now() - interval '7 days') AS runs_7d,
                    COUNT(*) FILTER (
                        WHERE r.started_at >= now() - interval '7 days'
                        AND r.status = 'failed'
                    ) AS failed_runs_7d,
                    COUNT(*) FILTER (
                        WHERE r.started_at >= now() - interval '7 days'
                        AND r.status = 'completed'
                    ) AS success_runs_7d,
                    COUNT(*) FILTER (WHERE r.started_at >= now() - interval '24 hours') AS runs_24h,
                    COUNT(*) FILTER (
                        WHERE r.started_at >= now() - interval '24 hours'
                        AND r.status = 'failed'
                    ) AS failed_runs_24h
                FROM filtered_runs r
                GROUP BY r.query_id
            ),
            source_breakdown AS (
                SELECT
                    sb.query_id,
                    jsonb_agg(
                        jsonb_build_object(
                            'source_type', sb.source_type,
                            'responses', sb.responses,
                            'brand_mentions', sb.brand_mentions,
                            'visibility', sb.visibility,
                            'prominence', sb.prominence,
                            'sentiment', sb.sentiment,
                            'runs', sb.runs,
                            'last_run', sb.last_run
                        )
                        ORDER BY sb.source_type
                    ) AS source_breakdown
                FROM source_breakdown_base sb
                GROUP BY sb.query_id
            )
            SELECT 
                q.id,
                q.query_text,
                q.frequency,
                q.brand_id,
                b.brand_name,
                b.logo_url AS brand_logo,
                q.query_type,
                q.created_at,
                q.is_active,
                q.is_paused,
                COUNT(a.id) AS responses,
                SUM(CASE WHEN a.mentions_brand THEN 1 ELSE 0 END) AS brand_mentions,
                COALESCE(ROUND(AVG(a.visibility_score)::numeric,2),0) AS visibility,
                COALESCE(ROUND(AVG(a.prominence_score)::numeric, 2),0) AS prominence,
                COALESCE(ROUND(AVG(a.sentiment_score)::numeric, 2),0) AS sentiment,
                COUNT(DISTINCT r.id) AS runs,
                MAX(r.started_at) AS last_run,
                COALESCE(rs.runs_7d, 0) AS runs_7d,
                COALESCE(rs.failed_runs_7d, 0) AS failed_runs_7d,
                COALESCE(rs.success_runs_7d, 0) AS success_runs_7d,
                COALESCE(rs.runs_24h, 0) AS runs_24h,
                COALESCE(rs.failed_runs_24h, 0) AS failed_runs_24h,
                COALESCE(sb.source_breakdown, '[]'::jsonb) AS source_breakdown
            FROM queries q
            JOIN brands b ON q.brand_id = b.id
            LEFT JOIN filtered_runs r ON r.query_id = q.id
            LEFT JOIN answers a ON a.run_id = r.id AND a.brand_id = q.brand_id
            LEFT JOIN run_stats rs ON rs.query_id = q.id
            LEFT JOIN source_breakdown sb ON sb.query_id = q.id
            WHERE ${queryFilters.join(" AND ")}
            GROUP BY 
                q.id,
                q.query_text,
                q.frequency,
                q.brand_id,
                b.brand_name,
                b.logo_url,
                q.query_type,
                q.created_at,
                q.is_active,
                q.is_paused,
                rs.runs_7d,
                rs.failed_runs_7d,
                rs.success_runs_7d,
                rs.runs_24h,
                rs.failed_runs_24h,
                sb.source_breakdown
            ORDER BY q.created_at DESC;
            `,
            values
        );

        const rows = result.rows;

        const totalQueries = rows.length;
        const activeQueries = rows.filter((q) => q.is_active).length;
        const pausedQueries = rows.filter((q) => q.is_active && q.is_paused).length;
        const inactiveQueries = rows.filter((q) => !q.is_active).length;
        const queriesNeverRun = rows.filter((q) => Number(q.runs || 0) === 0).length;

        const runs7d = rows.reduce((sum, q) => sum + Number(q.runs_7d || 0), 0);
        const successRuns7d = rows.reduce((sum, q) => sum + Number(q.success_runs_7d || 0), 0);
        const failedRuns7d = rows.reduce((sum, q) => sum + Number(q.failed_runs_7d || 0), 0);
        const runs24h = rows.reduce((sum, q) => sum + Number(q.runs_24h || 0), 0);
        const failedRuns24h = rows.reduce((sum, q) => sum + Number(q.failed_runs_24h || 0), 0);

        const runSuccessRate7d = runs7d > 0 ? Number(((successRuns7d / runs7d) * 100).toFixed(2)) : 0;

        res.json({
            queries: rows,
            summary: {
                total_queries: totalQueries,
                active_queries: activeQueries,
                paused_queries: pausedQueries,
                inactive_queries: inactiveQueries,
                run_success_rate_7d: runSuccessRate7d,
                runs_24h: runs24h,
                runs_7d: runs7d,
                queries_never_run: queriesNeverRun,
                failed_runs_24h: failedRuns24h,
                failed_runs_7d: failedRuns7d,
            },
        });

    } catch (err) {
        console.error("Failed to fetch queries:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /queries_for_brand_page
 */
router.get("/queries_for_brand_page", requireAuth, async (req, res) => {

    const result = await db.query(
        `
        SELECT q.id, q.is_active, q.is_paused
        FROM queries q
        WHERE customer_id = $1 AND is_deleted = FALSE
        `,
        [req.user!.customer_id]
    );

    res.json(result.rows);
});

/**
 * GET /queries/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        `
        SELECT *
        FROM queries
        WHERE id = $1 AND customer_id = $2 AND is_deleted = FALSE
        `,
        [id, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    res.json(result.rows[0]);
});

/**
 * DELETE /queries/:id
 * Soft delete + terminate schedule + cleanup schedule row
 */
router.delete("/:id", requireAuth, async (req, res) => {
    const { id: queryId } = req.params;

    const queryRes = await db.query(
        `
        SELECT q.id, q.is_active, q.schedule_id, qs.workflow_id
        FROM queries q
        LEFT JOIN query_schedules qs ON qs.id = q.schedule_id
        WHERE q.id = $1::uuid
        AND q.customer_id = $2::uuid
        AND q.is_deleted = FALSE
        `,
        [queryId, req.user!.customer_id]
    );

    if (queryRes.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const row = queryRes.rows[0];

    if (row.workflow_id) {
        try {
            const temporal = await getTemporalClient();
            const handle = temporal.workflow.getHandle(row.workflow_id);
            await handle.terminate("Query deleted by user");
        } catch (err: any) {
            if (!err.message?.includes("NOT_FOUND")) {
                console.error("Temporal terminate failed:", err);
                return res.status(500).json({ error: "Failed to stop workflow" });
            }
        }
    }

    await db.query("BEGIN");

    try {
        await db.query(
            `
            UPDATE queries
            SET is_deleted = TRUE,
                deleted_at = NOW(),
                is_active = FALSE,
                is_paused = FALSE,
                schedule_id = NULL
            WHERE id = $1::uuid
            AND customer_id = $2::uuid
            `,
            [queryId, req.user!.customer_id]
        );

        if (row.schedule_id) {
            await db.query(
                `
                DELETE FROM query_schedules
                WHERE id = $1::uuid
                `,
                [row.schedule_id]
            );
        }

        await db.query("COMMIT");
        res.json({ deleted: true });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Failed to soft-delete query:", err);
        res.status(500).json({ error: "Failed to delete query" });
    }
});

/**
 * POST /queries/:id/schedule
 * Manually trigger a Temporal workflow for a query
 */
router.post("/:id/manual-run", requireAuth, async (req, res) => {
    await syncPlanExpiry(req.user!.customer_id);

    const usageRes = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM runs
        WHERE customer_id = $1
        AND started_at >= date_trunc('month', now()) 
        `,
        [req.user!.customer_id]
    );

    const usage = usageRes.rows[0].count;

    const customerRes = await db.query(
        `
        SELECT run_limit
        FROM customers
        WHERE id = $1
        `,
        [req.user!.customer_id]
    );

    const limit = customerRes.rows[0].run_limit;

    if (usage >= limit) {
        return res.status(403).json({
            error: "run_limit_exceeded",
            limit,
            used: usage
        });
    }

    const { id: queryId } = req.params;

    // Verify query exists and is not deleted
    const queryResult = await db.query(
        `
        SELECT id, brand_id
        FROM queries
        WHERE id = $1 AND customer_id = $2 AND is_deleted = FALSE
        `,
        [queryId, req.user!.customer_id]
    );

    if (queryResult.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const brandId = queryResult.rows[0].brand_id;

    const sources = await getExecutionSources();

    if (sources.length === 0) {
        return res.status(500).json({ error: "No execution sources found" });
    }

    // Start Temporal workflow
    const temporal = await getTemporalClient();

    const handle = await temporal.workflow.start("querySchedulerWorkflow", {
        taskQueue: "asvp-query-scheduler",
        workflowId: `query-${queryId}-${Date.now()}`,
        args: [
            {
                queryId,
                sourceIds: sources.map((source) => source.id),
                customer_id: req.user!.customer_id,
                brand_id: brandId,
                trigger_type: "manual"
            },
        ],
    });

    res.json({
        message: "Workflow started",
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
    });
});

/**
 * POST /queries/:id/auto-schedule
 */
router.post("/:id/auto-schedule", requireAuth, async (req, res) => {
    await syncPlanExpiry(req.user!.customer_id);

    const usageRes = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM runs
        WHERE customer_id = $1
        AND started_at >= date_trunc('month', now()) 
        `,
        [req.user!.customer_id]
    );

    const usage = usageRes.rows[0].count;

    const customerRes = await db.query(
        `
        SELECT run_limit
        FROM customers
        WHERE id = $1
        `,
        [req.user!.customer_id]
    );

    const limit = customerRes.rows[0].run_limit;

    if (usage >= limit) {
        return res.status(403).json({
            error: "run_limit_exceeded",
            limit,
            used: usage
        });
    }

    const { id: queryId } = req.params;

    // Fetch query & ownership check
    const queryRes = await db.query(
        `
        SELECT id, frequency, is_active, is_deleted, brand_id
        FROM queries
        WHERE id = $1 AND customer_id = $2
        `,
        [queryId, req.user!.customer_id]
    );

    if (queryRes.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const query = queryRes.rows[0];
    const brandId = query.brand_id;

    if (query.is_deleted) {
        return res.status(400).json({ error: "Deleted query cannot be scheduled" });
    }

    if (query.is_active) {
        return res.status(400).json({ error: "Query already scheduled" });
    }

    // Validate frequency
    const cron = frequencyToCron(query.frequency);
    if (!cron) {
        return res.status(400).json({
            error: "Query frequency is manual; cannot auto-schedule",
        });
    }

    const sources = await getExecutionSources();

    if (sources.length === 0) {
        return res.status(500).json({ error: "No execution sources found" });
    }

    const workflowId = `cron-query-${queryId}`;
    const temporal = await getTemporalClient();

    // Start Temporal cron workflow (idempotent)
    try {
        await temporal.workflow.start("querySchedulerWorkflow", {
            taskQueue: "asvp-query-scheduler",
            workflowId,
            cronSchedule: cron,
            workflowExecutionTimeout: "365 days",
            args: [{
                queryId,
                sourceIds: sources.map((source) => source.id),
                customer_id: req.user!.customer_id,
                brand_id: brandId,
                trigger_type: "scheduled"
            }],
        });
    } catch (err: any) {
        if (err instanceof WorkflowExecutionAlreadyStartedError) {
            return res.status(409).json({
                error: "Query is already scheduled in Temporal",
            });
        }
        throw err;
    }

    // Persist DB state atomically
    await db.query("BEGIN");

    try {
        const scheduleRes = await db.query(
            `
            INSERT INTO query_schedules (query_id, source_id, workflow_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (query_id, source_id)
            DO UPDATE SET workflow_id = EXCLUDED.workflow_id
            RETURNING id
            `,
            [queryId, MULTI_SOURCE_SCHEDULE_KEY, workflowId]
        );

        const scheduleId = scheduleRes.rows[0].id;

        await db.query(
            `
            UPDATE queries
            SET is_active = true,
                schedule_id = $1
            WHERE id = $2
            `,
            [scheduleId, queryId]
        );

        await db.query("COMMIT");

        return res.json({
            message: "Query scheduled successfully",
            workflowId,
            cron,
            schedule_id: scheduleId,
        });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Failed to persist schedule:", err);
        return res.status(500).json({ error: "Failed to persist schedule" });
    }
});

/**
 * POST /queries/:id/unschedule
 * Stop cron execution of a query
 */
router.post("/:id/unschedule", requireAuth, async (req, res) => {
    const queryId = req.params.id;

    // Fetch query + schedule (LEFT JOIN is critical)
    const result = await db.query(
        `
        SELECT
        q.id,
        q.is_active,
        q.schedule_id,
        qs.workflow_id
        FROM queries q
        JOIN query_schedules qs
        ON qs.id = q.schedule_id
        WHERE q.id = $1::uuid
        AND q.customer_id = $2::uuid
        AND q.is_deleted = FALSE
        `,
        [queryId, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const query = result.rows[0];

    if (!query.is_active || !query.workflow_id) {
        return res.status(400).json({ error: "Query is not scheduled" });
    }

    const { workflow_id } = result.rows[0];

    // TERMINATE Temporal workflow
    try {
        const temporal = await getTemporalClient();
        const handle = temporal.workflow.getHandle(workflow_id);
        await handle.terminate("Query unscheduled by user");
    } catch (err: any) {
        if (!err.message?.includes("NOT_FOUND")) {
            console.error("Temporal terminate failed:", err);
            return res.status(500).json({ error: "Failed to stop workflow" });
        }
    }

    // Update DB (queries)
    await db.query(
        `
        UPDATE queries
        SET
        is_active = false,
        is_paused = false,
        schedule_id = NULL
        WHERE id = $1::uuid
        `,
        [queryId]
    );

    // Delete schedule row 
    await db.query(
        `
    DELETE FROM query_schedules
    WHERE workflow_id = $1
    `,
        [query.workflow_id]
    );

    res.json({ message: "Query unscheduled successfully" });
});

// POST /queries/:id/pause
router.post("/:id/pause", requireAuth, async (req, res) => {
    const { id: queryId } = req.params;

    const result = await db.query(
        `
        SELECT qs.workflow_id, q.is_active, q.schedule_id
        FROM queries q
        JOIN query_schedules qs ON qs.id = q.schedule_id
        WHERE q.id = $1::uuid
        AND q.customer_id = $2::uuid
        AND q.is_active = true
        AND q.is_deleted = FALSE
        `,
        [queryId, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const query = result.rows[0];
    if (!query.is_active || !query.schedule_id) {
        return res.status(400).json({ error: "Query is not scheduled" });
    }

    const { workflow_id } = result.rows[0];

    try {
        const temporal = await getTemporalClient();
        const handle = temporal.workflow.getHandle(workflow_id);

        await handle.signal("pause");
    } catch (err: any) {
        console.error("Failed to pause schedule:", err);
        return res.status(500).json({ error: "Failed to pause schedule" });
    }

    // Update DB
    await db.query(
        `
        UPDATE queries
        SET is_paused = true
        WHERE id = $1
        `,
        [queryId]
    );

    res.json({
        message: "Query schedule paused",
    });
});

/**
 * POST /queries/:id/resume
 */
router.post("/:id/resume", requireAuth, async (req, res) => {
    const { id: queryId } = req.params;

    const result = await db.query(
        `
        SELECT qs.workflow_id, q.is_active, q.schedule_id
        FROM queries q
        JOIN query_schedules qs ON qs.id = q.schedule_id
        WHERE q.id = $1::uuid
        AND q.customer_id = $2::uuid
        AND q.is_active = true
        AND q.is_deleted = FALSE
        `,
        [queryId, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Query not found" });
    }

    const query = result.rows[0];

    if (!query.is_active || !query.schedule_id) {
        return res.status(400).json({ error: "Query is not scheduled" });
    }

    const { workflow_id } = result.rows[0];

    try {
        const temporal = await getTemporalClient();
        const handle = temporal.workflow.getHandle(workflow_id);

        await handle.signal("resume");
    } catch (err: any) {
        console.error("Failed to resume schedule:", err);
        return res.status(500).json({ error: "Failed to resume schedule" });
    }

    // Update DB
    await db.query(
        `
        UPDATE queries
        SET is_paused = false
        WHERE id = $1
        `,
        [queryId]
    );

    res.json({
        message: "Query schedule resumed",
    });
});


export default router;
