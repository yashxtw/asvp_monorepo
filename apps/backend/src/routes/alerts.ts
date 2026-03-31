import { Router } from "express";
import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { getTemporalClient } from "../lib/temporalClient";

const router = Router();

function getAlertRecommendationHint(alertType: string) {
    switch (alertType) {
        case "visibility_drop":
            return "Review recent answer changes and generate visibility-focused recommendations.";
        case "mention_rate_drop":
            return "Check why the brand stopped getting cited and feed that evidence into recommendations.";
        case "negative_sentiment_spike":
            return "Inspect negative snippets and generate messaging or product-trust recommendations.";
        case "prominence_drop":
            return "Review where the brand appears in the answer and generate prominence-improvement recommendations.";
        case "brand_missing":
            return "Prioritize recommendation generation because the brand is missing on a branded query.";
        case "connector_failure":
            return "Fix connector health first. Recommendations generated from stale data will be low quality.";
        default:
            return "Review the evidence and decide whether to generate a recommendation.";
    }
}

router.get("/", requireAuth, async (req, res) => {
    const { status, severity, type, brand_id, source } = req.query;

    const values: unknown[] = [req.user!.customer_id];
    const filters: string[] = ["a.customer_id = $1"];

    if (status && typeof status === "string") {
        values.push(status);
        filters.push(`a.status = $${values.length}`);
    }

    if (severity && typeof severity === "string") {
        values.push(severity);
        filters.push(`a.severity = $${values.length}`);
    }

    if (type && typeof type === "string") {
        values.push(type);
        filters.push(`a.alert_type = $${values.length}`);
    }

    if (brand_id && typeof brand_id === "string") {
        values.push(brand_id);
        filters.push(`a.brand_id = $${values.length}`);
    }

    if (source && typeof source === "string") {
        values.push(source);
        filters.push(`s.type = $${values.length}`);
    }

    const result = await db.query(
        `
        SELECT
            a.*,
            b.brand_name,
            q.query_text,
            q.query_type,
            s.type AS source_type
        FROM alerts a
        LEFT JOIN brands b ON b.id = a.brand_id
        LEFT JOIN queries q ON q.id = a.query_id
        LEFT JOIN sources s ON s.id = a.source_id
        WHERE ${filters.join(" AND ")}
        ORDER BY
            CASE a.severity
                WHEN 'critical' THEN 4
                WHEN 'high' THEN 3
                WHEN 'medium' THEN 2
                ELSE 1
            END DESC,
            a.last_seen_at DESC,
            a.created_at DESC
        `,
        values
    );

    const rows = result.rows.map((row) => ({
        ...row,
        recommendation_hint: getAlertRecommendationHint(row.alert_type),
    }));

    const summary = rows.reduce(
        (acc, row) => {
            acc.total += 1;
            acc.by_status[row.status] = (acc.by_status[row.status] ?? 0) + 1;
            acc.by_severity[row.severity] = (acc.by_severity[row.severity] ?? 0) + 1;
            acc.by_type[row.alert_type] = (acc.by_type[row.alert_type] ?? 0) + 1;
            if (row.status !== "resolved") {
                acc.unresolved += 1;
            }
            if (row.brand_id) {
                acc.brand_ids.add(row.brand_id);
            }
            if (row.severity === "critical" || row.severity === "high") {
                acc.high_priority += 1;
            }
            return acc;
        },
        {
            total: 0,
            unresolved: 0,
            high_priority: 0,
            by_status: {} as Record<string, number>,
            by_severity: {} as Record<string, number>,
            by_type: {} as Record<string, number>,
            brand_ids: new Set<string>(),
        }
    );

    res.json({
        success: true,
        data: rows,
        summary: {
            total: summary.total,
            unresolved: summary.unresolved,
            high_priority: summary.high_priority,
            brands_impacted: summary.brand_ids.size,
            by_status: summary.by_status,
            by_severity: summary.by_severity,
            by_type: summary.by_type,
        },
    });
});

router.post("/run", requireAuth, async (req, res) => {
    const temporal = await getTemporalClient();
    const handle = await temporal.workflow.start("alertsDailyWorkflow", {
        taskQueue: "asvp-query-scheduler",
        workflowId: `alerts-${req.user!.customer_id}-${Date.now()}`,
        args: [{ customerId: req.user!.customer_id }],
    });

    res.json({
        success: true,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
    });
});

router.post("/:id/ack", requireAuth, async (req, res) => {
    const { id } = req.params;

    await db.query(
        `
        UPDATE alerts
        SET
            acknowledged_at = now(),
            status = 'acknowledged',
            last_seen_at = now()
        WHERE id = $1
          AND customer_id = $2
        `,
        [id, req.user!.customer_id]
    );

    res.json({ message: "Alert acknowledged" });
});

router.post("/:id/resolve", requireAuth, async (req, res) => {
    const { id } = req.params;

    await db.query(
        `
        UPDATE alerts
        SET
            status = 'resolved',
            resolved_at = now(),
            last_seen_at = now()
        WHERE id = $1
          AND customer_id = $2
        `,
        [id, req.user!.customer_id]
    );

    res.json({ message: "Alert resolved" });
});

export default router;
