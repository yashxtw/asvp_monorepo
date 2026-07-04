import { createApp } from "./api/app";
import { config } from "./config/env";
import { logger } from "./lib/logger";
import { ensureAllAlertsSchedules } from "./lib/alertsScheduler";
import { startDemoCleanupJob } from "./lib/demoCleanup";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

const app = createApp();

app.listen(config.port, () => {
    logger.info(`ASVP backend running on port ${config.port}`);
    ensureAllAlertsSchedules().catch((error) => {
        logger.error({ error }, "Failed to ensure daily alerts schedules");
    });
    startDemoCleanupJob();
});
