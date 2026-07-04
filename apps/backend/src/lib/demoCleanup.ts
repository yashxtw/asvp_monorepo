import { db } from "../db/client";
import { logger } from "./logger";

const DEMO_CUSTOMER_ID = "d3b07384-d113-41c3-a309-8809c916298b";

export async function cleanupDemoData() {
    logger.info("Starting demo data cleanup...");
    try {
        await db.query("BEGIN");

        // 1. Delete old queries (which cascades to runs & answers)
        const queriesDeleted = await db.query(
            `
            DELETE FROM queries
            WHERE customer_id = $1
              AND created_at < now() - interval '24 hours'
            `,
            [DEMO_CUSTOMER_ID]
        );

        // 2. Delete old brands
        const brandsDeleted = await db.query(
            `
            DELETE FROM brands
            WHERE customer_id = $1
              AND created_at < now() - interval '24 hours'
            `,
            [DEMO_CUSTOMER_ID]
        );

        // 3. Delete old demo sessions
        const sessionsDeleted = await db.query(
            `
            DELETE FROM demo_sessions
            WHERE created_at < now() - interval '24 hours'
            `
        );

        await db.query("COMMIT");

        logger.info(
            {
                queriesDeleted: queriesDeleted.rowCount,
                brandsDeleted: brandsDeleted.rowCount,
                sessionsDeleted: sessionsDeleted.rowCount,
            },
            "Demo data cleanup completed successfully"
        );
    } catch (error) {
        await db.query("ROLLBACK");
        logger.error({ error }, "Failed to execute demo data cleanup");
    }
}

export function startDemoCleanupJob() {
    // Run once on start
    cleanupDemoData().catch((error) => {
        logger.error({ error }, "Initial demo cleanup failed");
    });

    // Run every 1 hour
    setInterval(() => {
        cleanupDemoData().catch((error) => {
            logger.error({ error }, "Hourly demo cleanup failed");
        });
    }, 60 * 60 * 1000);
}
