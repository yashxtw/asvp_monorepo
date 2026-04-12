import { NativeConnection, Worker } from "@temporalio/worker";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

function parseBooleanEnv(value: string | undefined): boolean | undefined {
    if (value == null || value === "") return undefined;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getTemporalWorkerConfig() {
    const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
    const namespace = process.env.TEMPORAL_NAMESPACE || "default";
    const apiKey = process.env.TEMPORAL_API_KEY;
    const explicitTls = parseBooleanEnv(process.env.TEMPORAL_TLS);
    const useCloudTls =
        explicitTls ?? (address.includes(".api.temporal.io") || Boolean(apiKey));

    return {
        address,
        namespace,
        apiKey,
        tls: useCloudTls ? true : undefined,
    };
}

async function run() {
    const temporal = getTemporalWorkerConfig();
    console.log(
        `Connecting worker to Temporal namespace ${temporal.namespace} at ${temporal.address} (tls=${temporal.tls ? "on" : "off"})`
    );
    const connection = await NativeConnection.connect({
        address: temporal.address,
        tls: temporal.tls,
        apiKey: temporal.apiKey,
    });

    const worker = await Worker.create({
        connection,
        namespace: temporal.namespace,
        workflowsPath: path.join(__dirname, "workflows"),
        activities: require("./activities"),
        taskQueue: "asvp-query-scheduler"
    });

    console.log(
        `Temporal worker started for namespace ${temporal.namespace} at ${temporal.address}`
    );
    await worker.run();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
