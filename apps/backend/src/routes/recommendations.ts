import { Router } from "express";
import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { getTemporalClient } from "../lib/temporalClient";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                r.*,
                b.brand_name,
                q.query_text,
                q.query_type,
                s.type AS source_type
            FROM recommendations r
            LEFT JOIN brands b ON b.id = r.brand_id
            LEFT JOIN queries q ON q.id = r.query_id
            LEFT JOIN sources s ON s.id = r.source_id
            WHERE r.customer_id = $1
                AND r.resolved_at IS NULL
            ORDER BY
                COALESCE(r.priority_score, 0) DESC,
                CASE r.priority
                    WHEN 'high' THEN 3
                    WHEN 'medium' THEN 2
                    ELSE 1
                END DESC,
                r.created_at DESC
            `,
            [req.user!.customer_id]
        );

        res.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error("Failed to fetch recommendations:", error);
        res.status(500).json({
            error:
                error?.code === "42703"
                    ? "Recommendation schema is outdated. Run the latest DB migrations."
                    : "Failed to fetch recommendations",
        });
    }
});

router.post("/run", requireAuth, async (req, res) => {
    const temporal = await getTemporalClient();
    const handle = await temporal.workflow.start("recommendationsDailyWorkflow", {
        taskQueue: "asvp-query-scheduler",
        workflowId: `recommendations-${req.user!.customer_id}-${Date.now()}`,
        args: [{ customerId: req.user!.customer_id }],
    });

    res.json({
        success: true,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
    });
});

router.post("/:id/resolve", requireAuth, async (req, res) => {
    const { id } = req.params;

    await db.query(
        `
        UPDATE recommendations
        SET resolved_at = now()
        WHERE id = $1
            AND customer_id = $2
        `,
        [id, req.user!.customer_id]
    );

    res.json({ success: true });
});

export default router;
