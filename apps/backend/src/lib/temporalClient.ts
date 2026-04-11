import { Connection, Client } from "@temporalio/client";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

let client: Client | null = null;

function parseBooleanEnv(value: string | undefined): boolean | undefined {
    if (value == null || value === "") return undefined;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getTemporalConfig() {
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

export async function getTemporalClient(): Promise<Client> {
    if (client) return client;

    const temporal = getTemporalConfig();
    const connection = await Connection.connect({
        address: temporal.address,
        tls: temporal.tls,
        apiKey: temporal.apiKey,
    });

    client = new Client({
        connection,
        namespace: temporal.namespace,
    });
    return client;
}
