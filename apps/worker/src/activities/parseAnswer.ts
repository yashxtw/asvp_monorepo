import { db } from "../db/client";
import { ruleBasedParser } from "../parser/ruleBasedParser";

function normalizeSource(sourceType: string): "chatgpt" | "claude" | "gemini" | "google_aio" | "unknown" {
    const source = String(sourceType || "unknown").toLowerCase();

    if (source === "chatgpt") return "chatgpt";
    if (source === "claude") return "claude";
    if (source === "gemini") return "gemini";
    if (source === "google_aio") return "google_aio";

    return "unknown";
}

export async function parseAnswer(input: {
    runId: string;
}) {
    try {
        const res = await db.query(
            `
            SELECT
                a.id AS answer_id,
                a.raw_text,
                b.brand_name,
                s.type AS source_type
            FROM answers a
            JOIN runs r ON r.id = a.run_id
            JOIN queries q ON q.id = r.query_id
            JOIN brands b ON b.customer_id = q.customer_id
            JOIN sources s ON s.id = r.source_id
            WHERE r.id = $1
            `,
            [input.runId]
        );

        if (res.rows.length === 0) {
            await db.query(
                `
                UPDATE runs
                SET status = 'failed', error = 'answer_not_found', finished_at = now()
                WHERE id = $1
                `,
                [input.runId]
            );
            return;
        }

        const rawText = res.rows[0].raw_text;
        const brandNames = res.rows.map((r) => r.brand_name);
        const source = normalizeSource(res.rows[0].source_type);

        const parsed = await ruleBasedParser({
            raw_text: rawText,
            brandNames,
            source,
        });

        const visibilityData = parsed.confidence;
        const visibilityScore = parsed.confidence.visibility_score;
        const normalizedConfidence = Number((visibilityScore / 100).toFixed(3));

        await db.query(
            `
            UPDATE answers
            SET
                mentions_brand = $1,
                confidence = $2,
                sentiment = $3,
                prominence = $4,
                entities = $5,
                visibility = $6,
                sentiment_data = $7,
                prominence_data = $8,
                visibility_score = $9,
                sentiment_label = $10,
                sentiment_score = $11,
                prominence_score = $12,
                parsed_at = now()
            WHERE id = $13
            `,
            [
                parsed.mentions_brand,
                normalizedConfidence,
                parsed.sentiment.label,
                parsed.prominence.score,
                JSON.stringify(parsed.entities),
                JSON.stringify(visibilityData),
                JSON.stringify(parsed.sentiment),
                JSON.stringify(parsed.prominence),
                visibilityScore,
                parsed.sentiment.label,
                parsed.sentiment.score,
                parsed.prominence.score,
                res.rows[0].answer_id,
            ]
        );

        await db.query(
            `
            UPDATE runs
            SET status = 'completed', finished_at = now()
            WHERE id = $1
            `,
            [input.runId]
        );
    } catch (err: any) {
        await db.query(
            `
            UPDATE runs
            SET status = 'failed', error = $2, finished_at = now()
            WHERE id = $1
            `,
            [input.runId, err?.message || "parse_failed"]
        );
        throw err;
    }
}
