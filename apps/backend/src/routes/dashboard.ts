import { Router } from "express";
import { db } from "../db/client";

const router = Router();

function getDashboardWindow(range: unknown) {
    const normalized = range === "30d" ? "30d" : "7d";
    const currentDays = normalized === "30d" ? 30 : 7;
    const fetchDays = currentDays * 2;
    return { range: normalized, currentDays, fetchDays };
}

router.get("/visibility-overview", async (req, res) => {
    try {
        const { brandId, range } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const query = `
        SELECT
            created_at,
            visibility_score,
            (visibility->'breakdown'->>'trust')::float AS trust,
            (visibility->'breakdown'->>'sentiment')::float AS sentiment,
            (visibility->'breakdown'->>'brandPresence')::float AS "brandPresence"
        FROM answers
        WHERE customer_id = $1
          AND brand_id = $2
          AND created_at >= now() - ($3::int * interval '1 day')
        ORDER BY created_at DESC
        `;

        const result = await db.query(query, [customerId, brandId, fetchDays]);

        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/brandMentions", async (req, res) => {
    try {
        const { brandId, range } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const query = `
        SELECT
            date_trunc('day', created_at) AS day,
            COUNT(*) FILTER (WHERE mentions_brand = true) AS mentions,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE mentions_brand = true) * 100.0 / NULLIF(COUNT(*), 0) AS mention_rate
        FROM answers
        WHERE customer_id = $1
          AND brand_id = $2
          AND created_at >= now() - ($3::int * interval '1 day')
        GROUP BY day
        ORDER BY day;
        `;

        const trend = await db.query(query, [customerId, brandId, fetchDays]);
        return res.json({ success: true, data: trend.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/sentiment-overview", async (req, res) => {
    try {
        const { brandId, range } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const query = `
            SELECT
                created_at,
                (sentiment_data->>'score')::float AS sentiment_score,
                sentiment_data->>'label' AS sentiment_label,
                (sentiment_data->'similarities'->>'positive')::float AS positive_sim,
                (sentiment_data->'similarities'->>'neutral')::float AS neutral_sim,
                (sentiment_data->'similarities'->>'negative')::float AS negative_sim
            FROM answers
            WHERE customer_id = $1
              AND brand_id = $2
              AND created_at >= now() - ($3::int * interval '1 day')
            ORDER BY created_at DESC
        `;

        const aggregate = await db.query(query, [customerId, brandId, fetchDays]);
        return res.json({ success: true, data: aggregate.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/prominenceTrend", async (req, res) => {
    try {
        const { brandId, range } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const query = `
        SELECT
            created_at,
            prominence_score,
            (prominence_data->>'first_sentence_index')::int AS first_sentence_index,
            COALESCE(prominence_data->>'best_sentence', '') AS best_sentence
        FROM answers
        WHERE customer_id = $1
          AND brand_id = $2
          AND created_at >= now() - ($3::int * interval '1 day')
        ORDER BY created_at DESC
        `;

        const result = await db.query(query, [customerId, brandId, fetchDays]);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/entities", async (req, res) => {
    try {
        const { brandId, range } = req.query;
        const customerId = req.user?.customer_id;
        const { fetchDays } = getDashboardWindow(range);

        if (!brandId || typeof brandId !== "string") {
            return res.status(400).json({ error: "brandId required" });
        }

        const query = `
        SELECT
            entity->>'canonical_name' AS name,
            entity->>'type' AS type,
            COUNT(*) as mentions
        FROM answers,
             jsonb_array_elements(entities) entity
        WHERE customer_id = $1
          AND brand_id = $2
          AND created_at >= now() - ($3::int * interval '1 day')
          AND entity->>'type' = 'Company'
        GROUP BY name, type
        ORDER BY mentions DESC
        LIMIT 10;
        `;

        const result = await db.query(query, [customerId, brandId, fetchDays]);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/answers", async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        const query = `
        SELECT * FROM answers WHERE customer_id = $1 ORDER BY created_at DESC
        `;
        const result = await db.query(query, [customerId]);
        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
