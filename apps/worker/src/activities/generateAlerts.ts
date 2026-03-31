import { db } from "../db/client";

type AlertInput = {
    customerId: string;
    brandId?: string | null;
    queryId?: string | null;
    runId?: string | null;
    sourceId?: string | null;
    alertType: string;
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    message: string;
    metricValue?: number | null;
    baselineValue?: number | null;
    thresholdValue?: number | null;
    dedupeKey: string;
    evidence?: Record<string, unknown>;
};

async function createOrRefreshAlert(input: AlertInput) {
    const existing = await db.query(
        `
        SELECT id, status
        FROM alerts
        WHERE customer_id = $1
        AND dedupe_key = $2
        AND status IN ('open', 'acknowledged')
        LIMIT 1
        `,
        [input.customerId, input.dedupeKey]
    );

    if (existing.rows.length > 0) {
        await db.query(
            `
            UPDATE alerts
            SET
                severity = $2,
                title = $3,
                message = $4,
                metric_value = $5,
                baseline_value = $6,
                threshold_value = $7,
                evidence = $8,
                run_id = COALESCE($9, run_id),
                last_seen_at = now(),
                status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END
            WHERE id = $1
            `,
            [
                existing.rows[0].id,
                input.severity,
                input.title,
                input.message,
                input.metricValue ?? null,
                input.baselineValue ?? null,
                input.thresholdValue ?? null,
                JSON.stringify(input.evidence ?? {}),
                input.runId ?? null,
            ]
        );
        return;
    }

    await db.query(
        `
        INSERT INTO alerts (
            customer_id,
            brand_id,
            query_id,
            run_id,
            source_id,
            alert_type,
            severity,
            title,
            message,
            metric_value,
            baseline_value,
            threshold_value,
            dedupe_key,
            evidence,
            status,
            first_seen_at,
            last_seen_at
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, 'open', now(), now()
        )
        `,
        [
            input.customerId,
            input.brandId ?? null,
            input.queryId ?? null,
            input.runId ?? null,
            input.sourceId ?? null,
            input.alertType,
            input.severity,
            input.title,
            input.message,
            input.metricValue ?? null,
            input.baselineValue ?? null,
            input.thresholdValue ?? null,
            input.dedupeKey,
            JSON.stringify(input.evidence ?? {}),
        ]
    );
}

function roundMetric(value: unknown) {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function percentageDelta(current: number, baseline: number) {
    if (baseline === 0) {
        return null;
    }
    return Number((((current - baseline) / Math.abs(baseline)) * 100).toFixed(2));
}

export async function generateSoVDropAlerts(input: { customerId: string }) {
    const visibilityDropRows = await db.query(
        `
        WITH latest_runs AS (
            SELECT
                r.query_id,
                r.source_id,
                r.id AS run_id,
                ROW_NUMBER() OVER (
                    PARTITION BY r.query_id, r.source_id
                    ORDER BY r.started_at DESC, r.id DESC
                ) AS rn
            FROM runs r
            JOIN queries q ON q.id = r.query_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
        ),
        latest_runs_only AS (
            SELECT query_id, source_id, run_id
            FROM latest_runs
            WHERE rn = 1
        ),
        source_windows AS (
            SELECT
                q.id AS query_id,
                q.brand_id,
                q.query_text,
                q.query_type,
                r.source_id,
                lro.run_id AS latest_run_id,
                AVG(a.visibility_score) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_metric,
                AVG(a.visibility_score) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_metric,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_samples,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_samples
            FROM queries q
            JOIN runs r ON r.query_id = q.id
            JOIN answers a ON a.run_id = r.id
            LEFT JOIN latest_runs_only lro
                ON lro.query_id = r.query_id
               AND lro.source_id = r.source_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
            GROUP BY q.id, q.brand_id, q.query_text, q.query_type, r.source_id, lro.run_id
        )
        SELECT *
        FROM source_windows
        WHERE current_metric IS NOT NULL
          AND baseline_metric IS NOT NULL
          AND current_samples > 0
          AND baseline_samples > 0
          AND baseline_metric - current_metric >= 20
        `,
        [input.customerId]
    );

    for (const row of visibilityDropRows.rows) {
        const current = roundMetric(row.current_metric);
        const baseline = roundMetric(row.baseline_metric);
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.latest_run_id,
            sourceId: row.source_id,
            alertType: "visibility_drop",
            severity: baseline - current >= 35 ? "high" : "medium",
            title: "Visibility dropped",
            message: `Visibility fell from ${baseline.toFixed(1)} to ${current.toFixed(1)} for this query/source pair.`,
            metricValue: current,
            baselineValue: baseline,
            thresholdValue: 20,
            dedupeKey: `visibility_drop:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "visibility_score",
                current_visibility: current,
                baseline_visibility: baseline,
                delta_pct: percentageDelta(current, baseline),
                current_samples: Number(row.current_samples),
                baseline_samples: Number(row.baseline_samples),
                query_text: row.query_text,
                query_type: row.query_type,
                impact_area: "visibility",
                next_action_hint: "Investigate answer quality and brand presence on this source before generating recommendations.",
            },
        });
    }

    const mentionRateDropRows = await db.query(
        `
        WITH latest_runs AS (
            SELECT
                r.query_id,
                r.source_id,
                r.id AS run_id,
                ROW_NUMBER() OVER (
                    PARTITION BY r.query_id, r.source_id
                    ORDER BY r.started_at DESC, r.id DESC
                ) AS rn
            FROM runs r
            JOIN queries q ON q.id = r.query_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
        ),
        latest_runs_only AS (
            SELECT query_id, source_id, run_id
            FROM latest_runs
            WHERE rn = 1
        ),
        source_windows AS (
            SELECT
                q.id AS query_id,
                q.brand_id,
                q.query_text,
                q.query_type,
                r.source_id,
                lro.run_id AS latest_run_id,
                AVG(CASE WHEN a.mentions_brand THEN 100 ELSE 0 END) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_metric,
                AVG(CASE WHEN a.mentions_brand THEN 100 ELSE 0 END) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_metric,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_samples,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_samples
            FROM queries q
            JOIN runs r ON r.query_id = q.id
            JOIN answers a ON a.run_id = r.id
            LEFT JOIN latest_runs_only lro
                ON lro.query_id = r.query_id
               AND lro.source_id = r.source_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
            GROUP BY q.id, q.brand_id, q.query_text, q.query_type, r.source_id, lro.run_id
        )
        SELECT *
        FROM source_windows
        WHERE current_metric IS NOT NULL
          AND baseline_metric IS NOT NULL
          AND current_samples > 0
          AND baseline_samples > 0
          AND baseline_metric - current_metric >= 25
        `,
        [input.customerId]
    );

    for (const row of mentionRateDropRows.rows) {
        const current = roundMetric(row.current_metric);
        const baseline = roundMetric(row.baseline_metric);
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.latest_run_id,
            sourceId: row.source_id,
            alertType: "mention_rate_drop",
            severity: baseline - current >= 50 ? "high" : "medium",
            title: "Brand mention rate dropped",
            message: `Brand mention rate fell from ${baseline.toFixed(1)}% to ${current.toFixed(1)}%.`,
            metricValue: current,
            baselineValue: baseline,
            thresholdValue: 25,
            dedupeKey: `mention_rate_drop:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "mention_rate",
                current_mention_rate: current,
                baseline_mention_rate: baseline,
                delta_pct: percentageDelta(current, baseline),
                current_samples: Number(row.current_samples),
                baseline_samples: Number(row.baseline_samples),
                query_text: row.query_text,
                query_type: row.query_type,
                impact_area: "brand_presence",
                next_action_hint: "Inspect the answer content and entity extraction before drafting mention-improvement recommendations.",
            },
        });
    }

    const sentimentNegativeRows = await db.query(
        `
        WITH latest_runs AS (
            SELECT
                r.query_id,
                r.source_id,
                r.id AS run_id,
                ROW_NUMBER() OVER (
                    PARTITION BY r.query_id, r.source_id
                    ORDER BY r.started_at DESC, r.id DESC
                ) AS rn
            FROM runs r
            JOIN queries q ON q.id = r.query_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
        ),
        latest_runs_only AS (
            SELECT query_id, source_id, run_id
            FROM latest_runs
            WHERE rn = 1
        ),
        source_windows AS (
            SELECT
                q.id AS query_id,
                q.brand_id,
                q.query_text,
                q.query_type,
                r.source_id,
                lro.run_id AS latest_run_id,
                AVG(CASE WHEN a.sentiment_label = 'negative' THEN 100 ELSE 0 END) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_metric,
                AVG(CASE WHEN a.sentiment_label = 'negative' THEN 100 ELSE 0 END) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_metric,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_samples,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_samples
            FROM queries q
            JOIN runs r ON r.query_id = q.id
            JOIN answers a ON a.run_id = r.id
            LEFT JOIN latest_runs_only lro
                ON lro.query_id = r.query_id
               AND lro.source_id = r.source_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
            GROUP BY q.id, q.brand_id, q.query_text, q.query_type, r.source_id, lro.run_id
        )
        SELECT *
        FROM source_windows
        WHERE current_metric IS NOT NULL
          AND baseline_metric IS NOT NULL
          AND current_samples > 0
          AND baseline_samples > 0
          AND current_metric - baseline_metric >= 25
        `,
        [input.customerId]
    );

    for (const row of sentimentNegativeRows.rows) {
        const current = roundMetric(row.current_metric);
        const baseline = roundMetric(row.baseline_metric);
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.latest_run_id,
            sourceId: row.source_id,
            alertType: "negative_sentiment_spike",
            severity: current >= 70 ? "high" : "medium",
            title: "Negative sentiment spiked",
            message: `Negative-answer share increased from ${baseline.toFixed(1)}% to ${current.toFixed(1)}%.`,
            metricValue: current,
            baselineValue: baseline,
            thresholdValue: 25,
            dedupeKey: `negative_sentiment_spike:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "negative_sentiment_rate",
                current_negative_rate: current,
                baseline_negative_rate: baseline,
                delta_pct: percentageDelta(current, baseline),
                current_samples: Number(row.current_samples),
                baseline_samples: Number(row.baseline_samples),
                query_text: row.query_text,
                query_type: row.query_type,
                impact_area: "sentiment",
                next_action_hint: "Review the underlying snippets and product positioning before asking the recommendation engine for remediation steps.",
            },
        });
    }

    const prominenceDropRows = await db.query(
        `
        WITH latest_runs AS (
            SELECT
                r.query_id,
                r.source_id,
                r.id AS run_id,
                ROW_NUMBER() OVER (
                    PARTITION BY r.query_id, r.source_id
                    ORDER BY r.started_at DESC, r.id DESC
                ) AS rn
            FROM runs r
            JOIN queries q ON q.id = r.query_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
        ),
        latest_runs_only AS (
            SELECT query_id, source_id, run_id
            FROM latest_runs
            WHERE rn = 1
        ),
        source_windows AS (
            SELECT
                q.id AS query_id,
                q.brand_id,
                q.query_text,
                q.query_type,
                r.source_id,
                lro.run_id AS latest_run_id,
                AVG(a.prominence_score) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_metric,
                AVG(a.prominence_score) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_metric,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '1 day'
                ) AS current_samples,
                COUNT(*) FILTER (
                    WHERE r.started_at >= now() - interval '8 days'
                      AND r.started_at < now() - interval '1 day'
                ) AS baseline_samples
            FROM queries q
            JOIN runs r ON r.query_id = q.id
            JOIN answers a ON a.run_id = r.id
            LEFT JOIN latest_runs_only lro
                ON lro.query_id = r.query_id
               AND lro.source_id = r.source_id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
            GROUP BY q.id, q.brand_id, q.query_text, q.query_type, r.source_id, lro.run_id
        )
        SELECT *
        FROM source_windows
        WHERE current_metric IS NOT NULL
          AND baseline_metric IS NOT NULL
          AND current_samples > 0
          AND baseline_samples > 0
          AND baseline_metric - current_metric >= 0.15
        `,
        [input.customerId]
    );

    for (const row of prominenceDropRows.rows) {
        const current = roundMetric(row.current_metric);
        const baseline = roundMetric(row.baseline_metric);
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.latest_run_id,
            sourceId: row.source_id,
            alertType: "prominence_drop",
            severity: baseline - current >= 0.3 ? "high" : "medium",
            title: "Prominence dropped",
            message: `Prominence score fell from ${baseline.toFixed(2)} to ${current.toFixed(2)}.`,
            metricValue: current,
            baselineValue: baseline,
            thresholdValue: 0.15,
            dedupeKey: `prominence_drop:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "prominence_score",
                current_prominence: current,
                baseline_prominence: baseline,
                delta_pct: percentageDelta(current, baseline),
                current_samples: Number(row.current_samples),
                baseline_samples: Number(row.baseline_samples),
                query_text: row.query_text,
                query_type: row.query_type,
                impact_area: "prominence",
                next_action_hint: "Inspect where the brand is appearing in the answer before generating prominence-improvement recommendations.",
            },
        });
    }

    const brandMissingRows = await db.query(
        `
        WITH latest_answers AS (
            SELECT DISTINCT ON (q.id, r.source_id)
                q.id AS query_id,
                q.brand_id,
                q.query_text,
                q.query_type,
                r.id AS run_id,
                r.source_id,
                a.mentions_brand,
                a.visibility_score,
                a.raw_text
            FROM queries q
            JOIN runs r ON r.query_id = q.id
            JOIN answers a ON a.run_id = r.id
            WHERE q.customer_id = $1
              AND q.is_deleted = FALSE
            ORDER BY q.id, r.source_id, r.started_at DESC
        )
        SELECT *
        FROM latest_answers
        WHERE query_type = 'brand'
          AND mentions_brand = FALSE
        `,
        [input.customerId]
    );

    for (const row of brandMissingRows.rows) {
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.run_id,
            sourceId: row.source_id,
            alertType: "brand_missing",
            severity: "high",
            title: "Brand missing in branded query",
            message: `Your brand was not mentioned for branded query "${row.query_text}".`,
            metricValue: Number(row.visibility_score ?? 0),
            thresholdValue: 1,
            dedupeKey: `brand_missing:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "brand_presence",
                raw_text: row.raw_text,
                query_text: row.query_text,
                query_type: row.query_type,
                impact_area: "brand_presence",
                next_action_hint: "This is a strong candidate for recommendation generation because the brand is missing on a branded query.",
            },
        });
    }

    const connectorFailureRows = await db.query(
        `
        SELECT
            q.id AS query_id,
            q.brand_id,
            q.query_text,
            r.id AS run_id,
            r.source_id,
            a.raw_text,
            r.error
        FROM runs r
        JOIN queries q ON q.id = r.query_id
        LEFT JOIN answers a ON a.run_id = r.id
        WHERE q.customer_id = $1
          AND r.started_at >= now() - interval '1 day'
          AND (
              r.status = 'failed'
              OR COALESCE(a.raw_text, '') ILIKE 'Gemini API error:%'
              OR COALESCE(a.raw_text, '') ILIKE '%quota exceeded%'
              OR COALESCE(a.raw_text, '') ILIKE '%resource_exhausted%'
          )
        `,
        [input.customerId]
    );

    for (const row of connectorFailureRows.rows) {
        await createOrRefreshAlert({
            customerId: input.customerId,
            brandId: row.brand_id,
            queryId: row.query_id,
            runId: row.run_id,
            sourceId: row.source_id,
            alertType: "connector_failure",
            severity: "high",
            title: "Connector or quota failure",
            message: "A recent answer fetch failed due to API or quota limits.",
            dedupeKey: `connector_failure:${row.query_id}:${row.source_id}`,
            evidence: {
                metric_name: "connector_health",
                raw_text: row.raw_text,
                run_error: row.error,
                query_text: row.query_text,
                impact_area: "operations",
                next_action_hint: "Resolve connector health before generating content recommendations because downstream metrics will be stale.",
            },
        });
    }
}
