import { Router } from "express";
import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import {
    buildDashboardCacheKey,
    deleteDashboardCacheKey,
    getCachedDashboardResponse,
    setCachedDashboardResponse,
} from "../lib/dashboardCache";

const router = Router();

function getBrandsDashboardCacheKey(customerId: string) {
    return buildDashboardCacheKey("brands-list", {
        customerId,
    });
}

function getBrandsInBrandsPageCacheKey(customerId: string) {
    return buildDashboardCacheKey("brands-list-in-brands-page", {
        customerId,
    });
}

/**
 * POST /brands
 * body: { brand_name: string, canonical_urls: string[] }
 */
router.post("/", requireAuth, async (req, res) => {
    const { brand_name, canonical_urls, description, logo_url, competitors } = req.body;

    if (!brand_name || !Array.isArray(canonical_urls)) {
        return res.status(400).json({ error: "Invalid payload" });
    }

    try {
        const result = await db.query(
            `
        INSERT INTO brands (customer_id, brand_name, canonical_urls, description, logo_url, competitors)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
            [req.user!.customer_id, brand_name, canonical_urls, description, logo_url, competitors]
        );

        await deleteDashboardCacheKey(getBrandsDashboardCacheKey(req.user!.customer_id));
        await deleteDashboardCacheKey(getBrandsInBrandsPageCacheKey(req.user!.customer_id));
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "Brand already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /brands
 */
router.get("/", requireAuth, async (req, res) => {

    const cacheKey = getBrandsInBrandsPageCacheKey(req.user!.customer_id);
    const cached = await getCachedDashboardResponse<any[]>(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    const result = await db.query(
        `
                WITH ranked_runs AS (
            SELECT
                r.*,
                q.brand_id,
                ROW_NUMBER() OVER (
                    PARTITION BY q.brand_id
                    ORDER BY r.started_at DESC
                ) as rn
            FROM runs r
            JOIN queries q ON q.id = r.query_id
        )

        SELECT
            b.id,
            b.brand_name,
            b.description,
            b.canonical_urls,
            b.logo_url,
            b.competitors,

            COUNT(DISTINCT q.id) AS total_queries,

            COUNT(DISTINCT q.id) FILTER (
                WHERE q.is_active = true AND q.is_deleted = false
            ) AS active_queries,

            MAX(rr.started_at) AS last_run_time,

            AVG(a.visibility_score) AS avg_visibility,

            AVG(a.sentiment_score) AS avg_sentiment,

            (
                SUM(CASE WHEN a.mentions_brand = true THEN 1 ELSE 0 END)::float
                / NULLIF(COUNT(a.id),0)
            ) * 100 AS mention_rate

        FROM brands b

        LEFT JOIN queries q
            ON q.brand_id = b.id
            AND q.is_deleted = false

        LEFT JOIN ranked_runs rr
            ON rr.query_id = q.id
            AND rr.rn <= 14

        LEFT JOIN answers a
            ON a.run_id = rr.id
            AND a.brand_id = b.id
            AND a.customer_id = b.customer_id

        WHERE b.customer_id = $1

        GROUP BY
            b.id,
            b.brand_name,
            b.description,
            b.canonical_urls,
            b.logo_url,
            b.competitors
        ORDER BY b.created_at DESC;
        `,
        [req.user!.customer_id]
    );

    await setCachedDashboardResponse(cacheKey, result.rows);
    res.json(result.rows);
});


/**
 * GET /brands_for_dashboard
 */
router.get("/for_dashboard", requireAuth, async (req, res) => {
    const cacheKey = getBrandsDashboardCacheKey(req.user!.customer_id);

    const cached = await getCachedDashboardResponse<any[]>(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    const result = await db.query(
        `
        SELECT
            b.id,
            b.brand_name
        FROM brands b
        WHERE b.customer_id = $1
        `,
        [req.user!.customer_id]
    );

    await setCachedDashboardResponse(cacheKey, result.rows);
    res.json(result.rows);
});

/**
 * GET /brands/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        `
        SELECT * FROM brands
        WHERE id = $1 AND customer_id = $2
        `,
        [id, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Brand not found" });
    }

    res.json(result.rows[0]);
});

/**
 * PATCH /brands/:id
 * body: partial of { brand_name, canonical_urls, description, logo_url, competitors }
 */
router.patch("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { brand_name, canonical_urls, description, logo_url, competitors } = req.body ?? {};

    if (
        brand_name === undefined &&
        canonical_urls === undefined &&
        description === undefined &&
        logo_url === undefined &&
        competitors === undefined
    ) {
        return res.status(400).json({ error: "No fields to update" });
    }

    if (canonical_urls !== undefined && !Array.isArray(canonical_urls)) {
        return res.status(400).json({ error: "canonical_urls must be an array" });
    }

    if (competitors !== undefined && !Array.isArray(competitors)) {
        return res.status(400).json({ error: "competitors must be an array" });
    }

    const result = await db.query(
        `
        UPDATE brands
        SET
            brand_name = COALESCE($1, brand_name),
            canonical_urls = COALESCE($2, canonical_urls),
            description = COALESCE($3, description),
            logo_url = COALESCE($4, logo_url),
            competitors = COALESCE($5, competitors)
        WHERE id = $6 AND customer_id = $7
        RETURNING *
        `,
        [
            brand_name ?? null,
            canonical_urls ?? null,
            description ?? null,
            logo_url ?? null,
            competitors ?? null,
            id,
            req.user!.customer_id,
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Brand not found" });
    }

    await deleteDashboardCacheKey(getBrandsDashboardCacheKey(req.user!.customer_id));
    await deleteDashboardCacheKey(getBrandsInBrandsPageCacheKey(req.user!.customer_id));
    res.json(result.rows[0]);
});

/**
 * DELETE /brands/:id
 */
router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        `
        DELETE FROM brands
        WHERE id = $1 AND customer_id = $2
        RETURNING id
        `,
        [id, req.user!.customer_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Brand not found" });
    }

    await deleteDashboardCacheKey(getBrandsDashboardCacheKey(req.user!.customer_id));
    await deleteDashboardCacheKey(getBrandsInBrandsPageCacheKey(req.user!.customer_id));
    res.json({ deleted: true });
});

export default router;
