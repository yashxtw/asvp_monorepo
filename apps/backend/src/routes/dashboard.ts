import { Router } from "express";
import { db } from "../db/client";

const router = Router();

function getDashboardWindow(range: unknown) {
    const normalized = range === "30d" ? "30d" : "7d";
    const currentDays = normalized === "30d" ? 30 : 7;
    const fetchDays = currentDays * 2;
    return { range: normalized, currentDays, fetchDays };
}

function appendSourceFilter(
    source: unknown,
    values: unknown[],
    filters: string[],
    sourceAlias = "s"
) {
    if (source && typeof source === "string") {
        values.push(source);
        filters.push(`${sourceAlias}.type = $${values.length}`);
    }
}

router.get("/visibility-overview", async (req, res) => {
    try {
        const { brandId, range, source } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const values: unknown[] = [customerId, brandId, fetchDays];
        const filters = [
            "a.customer_id = $1",
            "a.brand_id = $2",
            "a.created_at >= now() - ($3::int * interval '1 day')",
        ];
        appendSourceFilter(source, values, filters);

        const query = `
        SELECT
            a.created_at,
            a.visibility_score,
            (a.visibility->'breakdown'->>'trust')::float AS trust,
            (a.visibility->'breakdown'->>'sentiment')::float AS sentiment,
            (a.visibility->'breakdown'->>'brandPresence')::float AS "brandPresence",
            s.type AS source_type
        FROM answers a
        JOIN sources s ON s.id = a.source_id
        WHERE ${filters.join(" AND ")}
        ORDER BY a.created_at DESC
        `;

        const result = await db.query(query, values);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/brandMentions", async (req, res) => {
    try {
        const { brandId, range, source } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const values: unknown[] = [customerId, brandId, fetchDays];
        const filters = [
            "a.customer_id = $1",
            "a.brand_id = $2",
            "a.created_at >= now() - ($3::int * interval '1 day')",
        ];
        appendSourceFilter(source, values, filters);

        const query = `
        SELECT
            date_trunc('day', a.created_at) AS day,
            COUNT(*) FILTER (WHERE a.mentions_brand = true) AS mentions,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE a.mentions_brand = true) * 100.0 / NULLIF(COUNT(*), 0) AS mention_rate
        FROM answers a
        JOIN sources s ON s.id = a.source_id
        WHERE ${filters.join(" AND ")}
        GROUP BY day
        ORDER BY day;
        `;

        const trend = await db.query(query, values);
        return res.json({ success: true, data: trend.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/sentiment-overview", async (req, res) => {
    try {
        const { brandId, range, source } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const values: unknown[] = [customerId, brandId, fetchDays];
        const filters = [
            "a.customer_id = $1",
            "a.brand_id = $2",
            "a.created_at >= now() - ($3::int * interval '1 day')",
        ];
        appendSourceFilter(source, values, filters);

        const query = `
            SELECT
                a.created_at,
                (a.sentiment_data->>'score')::float AS sentiment_score,
                a.sentiment_data->>'label' AS sentiment_label,
                (a.sentiment_data->'similarities'->>'positive')::float AS positive_sim,
                (a.sentiment_data->'similarities'->>'neutral')::float AS neutral_sim,
                (a.sentiment_data->'similarities'->>'negative')::float AS negative_sim,
                s.type AS source_type
            FROM answers a
            JOIN sources s ON s.id = a.source_id
            WHERE ${filters.join(" AND ")}
            ORDER BY a.created_at DESC
        `;

        const aggregate = await db.query(query, values);
        return res.json({ success: true, data: aggregate.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/prominenceTrend", async (req, res) => {
    try {
        const { brandId, range, source } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const values: unknown[] = [customerId, brandId, fetchDays];
        const filters = [
            "a.customer_id = $1",
            "a.brand_id = $2",
            "a.created_at >= now() - ($3::int * interval '1 day')",
        ];
        appendSourceFilter(source, values, filters);

        const query = `
        SELECT
            a.created_at,
            a.prominence_score,
            (a.prominence_data->>'first_sentence_index')::int AS first_sentence_index,
            COALESCE(a.prominence_data->>'best_sentence', '') AS best_sentence,
            s.type AS source_type
        FROM answers a
        JOIN sources s ON s.id = a.source_id
        WHERE ${filters.join(" AND ")}
        ORDER BY a.created_at DESC
        `;

        const result = await db.query(query, values);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/entities", async (req, res) => {
    try {
        const { brandId, range, source } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const values: unknown[] = [customerId, brandId, fetchDays];
        const filters = [
            "a.customer_id = $1",
            "a.brand_id = $2",
            "a.created_at >= now() - ($3::int * interval '1 day')",
            "entity->>'type' = 'Company'",
        ];
        appendSourceFilter(source, values, filters);

        const query = `
        SELECT
            COALESCE(entity->>'canonical_name', entity->>'name', 'Unknown') AS name,
            entity->>'type' AS type,
            COUNT(*) as mentions
        FROM answers a
        JOIN sources s ON s.id = a.source_id
        CROSS JOIN LATERAL jsonb_array_elements(a.entities) entity
        WHERE ${filters.join(" AND ")}
        GROUP BY name, type
        ORDER BY mentions DESC
        LIMIT 10;
        `;

        const result = await db.query(query, values);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/answers", async (req, res) => {
    try {
        const { brand_id, source } = req.query;
        const customerId = req.user?.customer_id;

        const values: unknown[] = [customerId];
        const filters = ["a.customer_id = $1"];

        if (brand_id && typeof brand_id === "string") {
            values.push(brand_id);
            filters.push(`a.brand_id = $${values.length}`);
        }

        appendSourceFilter(source, values, filters);

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
        WHERE ${filters.join(" AND ")}
        GROUP BY a.execution_group_id, a.query_id, q.query_text, a.brand_id, b.brand_name
        ORDER BY MAX(a.created_at) DESC
        LIMIT 25
        `;

        const result = await db.query(query, values);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
