import { db } from "../db/client";
import { getConnectorBySourceType } from "../connectors";

export async function fetchAndStoreAnswer(input: {
    runId: string;
    queryId: string;
    sourceId: string;
    customer_id: string;
    brand_id: string;
    execution_group_id?: string;
}) {
    // Mark run as running
    await db.query(
        `
        UPDATE runs
        SET status = 'running', error = NULL
        WHERE id = $1
        `,
        [input.runId]
    );

    try {
        // Guard: do not execute deleted queries
        const queryRes = await db.query(
            `
            SELECT q.query_text, q.query_type, s.type AS source_type
            FROM queries q
            JOIN sources s ON s.id = $1
            WHERE q.id = $2
            AND q.is_deleted = FALSE
            `,
            [input.sourceId, input.queryId]
        );

        const row = queryRes.rows[0];
        if (!row) throw new Error("Query or source not found");

        // Get connector
        const connector = getConnectorBySourceType(row.source_type);

        // Fetch raw answer
        const result = await connector.fetch({
            queryText: row.query_text,
            queryType: row.query_type,
            runId: input.runId
        });

        // Store raw answer
        await db.query(
            `
            INSERT INTO answers (
                run_id,
                query_id,
                source_id,
                execution_group_id,
                raw_text,
                metadata,
                screenshot_path,
                html_path,
                customer_id,
                brand_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
                input.runId,
                input.queryId,
                input.sourceId,
                input.execution_group_id || input.runId,
                result.raw_text,
                result.metadata,
                result.screenshot_path || null,
                result.html_path || null,
                input.customer_id,
                input.brand_id
            ]
        );
    } catch (err: any) {
        await db.query(
            `
            UPDATE runs
            SET status = 'failed', error = $2, finished_at = now()
            WHERE id = $1
            `,
            [input.runId, err?.message || "fetch_failed"]
        );
        throw err;
    }
}
