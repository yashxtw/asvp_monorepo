import { db } from "../db/client";
import { FLAGS } from "../config/flags";
import { callLLMRecommend, type RecommendationEngineRecord } from "../llm/client";

function classifyQueryIntent(query: string, queryType?: string | null) {
    const lower = query.toLowerCase();

    if (lower.includes("best ") || lower.includes("top ")) {
        return "listicle";
    }

    if (lower.includes(" vs ") || lower.includes("compare") || queryType === "competitor") {
        return "comparison";
    }

    if (
        lower.startsWith("what is") ||
        lower.startsWith("how to") ||
        lower.startsWith("why ") ||
        queryType === "category"
    ) {
        return "informational";
    }

    if (queryType === "brand") {
        return "navigational";
    }

    return "commercial_investigation";
}

function extractCompetitors(entities: any[] | null | undefined, brandName: string) {
    if (!Array.isArray(entities)) {
        return [];
    }

    const normalizedBrand = brandName.trim().toLowerCase();
    return [...new Set(
        entities
            .map((entity) => String(entity?.canonical_name || entity?.name || "").trim())
            .filter(Boolean)
            .filter((name) => name.toLowerCase() !== normalizedBrand)
    )].slice(0, 6);
}

function getObservedGap(row: any) {
    if (!row.mentions_brand && row.competitors_detected.length > 0) {
        return "Brand is absent while competitors are present in the answer.";
    }

    if (!row.mentions_brand) {
        return "Brand is absent from the answer.";
    }

    if ((row.prominence_score ?? 0) < 0.2) {
        return "Brand is mentioned but not prominently surfaced in the answer.";
    }

    if (row.sentiment_label === "negative") {
        return "Brand is represented with negative sentiment.";
    }

    return "Brand visibility is weaker than expected for this query.";
}

async function upsertStructuredRecommendation(input: {
    customerId: string;
    brandId: string | null;
    queryId: string | null;
    sourceId: string | null;
    sourceType: string;
    recommendation: RecommendationEngineRecord;
}) {
    const dedupeCheck = await db.query(
        `
        SELECT id
        FROM recommendations
        WHERE customer_id = $1
          AND query_id IS NOT DISTINCT FROM $2
          AND source_id IS NOT DISTINCT FROM $3
          AND root_cause = $4
          AND type = $5
          AND resolved_at IS NULL
        LIMIT 1
        `,
        [
            input.customerId,
            input.queryId,
            input.sourceId,
            input.recommendation.root_cause,
            input.recommendation.recommendation_type,
        ]
    );

    const dbValues = [
        input.customerId,
        input.brandId,
        input.sourceId,
        input.queryId,
        input.recommendation.recommendation_type,
        input.recommendation.priority,
        input.recommendation.reason,
        JSON.stringify(input.recommendation.evidence ?? {}),
        input.recommendation.root_cause,
        JSON.stringify(input.recommendation.secondary_causes ?? []),
        input.recommendation.reason,
        input.recommendation.query_intent,
        JSON.stringify(input.recommendation.content ?? {}),
        JSON.stringify(input.recommendation.distribution ?? []),
        input.recommendation.priority_score,
        input.recommendation.confidence,
        input.sourceType,
    ];

    if (dedupeCheck.rows.length > 0) {
        await db.query(
            `
            UPDATE recommendations
            SET
                brand_id = $2,
                priority = $6,
                message = $7,
                evidence = $8::jsonb,
                secondary_causes = $10::jsonb,
                reason = $11,
                query_intent = $12,
                content = $13::jsonb,
                distribution = $14::jsonb,
                priority_score = $15,
                confidence = $16,
                source_type_snapshot = $17,
                created_at = now()
            WHERE id = $1
            `,
            [dedupeCheck.rows[0].id, ...dbValues.slice(1)]
        );
        return;
    }

    await db.query(
        `
        INSERT INTO recommendations (
            customer_id,
            brand_id,
            source_id,
            query_id,
            type,
            priority,
            message,
            evidence,
            root_cause,
            secondary_causes,
            reason,
            query_intent,
            content,
            distribution,
            priority_score,
            confidence,
            source_type_snapshot
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11, $12, $13::jsonb, $14::jsonb, $15, $16, $17
        )
        `,
        dbValues
    );
}

export async function generateRecommendations(input: { customerId: string }) {
    if (!FLAGS.ENABLE_LLM_RECOMMENDATIONS) {
        return;
    }

    const candidateRows = await db.query(
        `
        SELECT
            a.id AS alert_id,
            a.alert_type,
            a.message AS alert_message,
            a.evidence AS alert_evidence,
            a.brand_id,
            a.query_id,
            a.source_id,
            q.query_text,
            q.query_type,
            b.brand_name,
            s.type AS source_type,
            ans.mentions_brand,
            ans.visibility_score,
            ans.sentiment_label,
            ans.sentiment_score,
            ans.prominence_score,
            ans.entities,
            ans.raw_text
        FROM alerts a
        LEFT JOIN queries q ON q.id = a.query_id
        LEFT JOIN brands b ON b.id = a.brand_id
        LEFT JOIN sources s ON s.id = a.source_id
        LEFT JOIN answers ans ON ans.run_id = a.run_id
        WHERE a.customer_id = $1
          AND a.status IN ('open', 'acknowledged')
          AND a.alert_type <> 'connector_failure'
          AND a.last_seen_at >= now() - interval '7 days'
        ORDER BY
            CASE a.severity
                WHEN 'critical' THEN 4
                WHEN 'high' THEN 3
                WHEN 'medium' THEN 2
                ELSE 1
            END DESC,
            a.last_seen_at DESC
        LIMIT 20
        `,
        [input.customerId]
    );

    for (const row of candidateRows.rows) {
        try {
            const competitors = extractCompetitors(row.entities, row.brand_name || "");
            const llmPayload = {
                query: row.query_text || "Unknown query",
                query_type: row.query_type || "unknown",
                query_intent: classifyQueryIntent(row.query_text || "", row.query_type),
                source_type: row.source_type || "unknown",
                brand: row.brand_name || "Unknown brand",
                brand_id: row.brand_id,
                mentions_brand: Boolean(row.mentions_brand),
                visibility_score: row.visibility_score ?? null,
                sentiment_label: row.sentiment_label ?? null,
                sentiment_score: row.sentiment_score ?? null,
                prominence_score: row.prominence_score ?? null,
                entities: Array.isArray(row.entities) ? row.entities : [],
                competitors_detected: competitors,
                raw_text: row.raw_text || "",
                alert_context: {
                    alert_type: row.alert_type,
                    alert_message: row.alert_message,
                    alert_evidence: row.alert_evidence ?? {},
                    observed_gap: getObservedGap({
                        mentions_brand: row.mentions_brand,
                        prominence_score: row.prominence_score,
                        sentiment_label: row.sentiment_label,
                        competitors_detected: competitors,
                    }),
                },
            };

            const llmResult = await callLLMRecommend(llmPayload);

            for (const recommendation of llmResult.recommendations ?? []) {
                await upsertStructuredRecommendation({
                    customerId: input.customerId,
                    brandId: row.brand_id ?? null,
                    queryId: row.query_id ?? null,
                    sourceId: row.source_id ?? null,
                    sourceType: row.source_type || "unknown",
                    recommendation,
                });
            }
        } catch (error) {
            console.error("Structured recommendation generation failed:", error);
        }
    }
}
