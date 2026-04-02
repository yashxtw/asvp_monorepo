import { createClient } from "redis";

type AppRedisClient = ReturnType<typeof createClient>;

let redisClient: AppRedisClient | null = null;
let redisConnectPromise: Promise<AppRedisClient | null> | null = null;
let redisDisabled = false;

function getRedisConnectionUrl() {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host || !port) {
        return null;
    }

    return `redis://${host}:${port}`;
}

export async function getRedisClient() {
    if (redisDisabled) {
        return null;
    }

    if (redisClient?.isOpen) {
        return redisClient;
    }

    if (redisConnectPromise) {
        return redisConnectPromise;
    }

    const url = getRedisConnectionUrl();

    if (!url) {
        redisDisabled = true;
        return null;
    }

    const client = createClient({ url });

    client.on("error", (error) => {
        console.error("Redis client error:", error);
    });

    redisConnectPromise = client
        .connect()
        .then(() => {
            redisClient = client;
            return client;
        })
        .catch((error) => {
            console.error("Failed to connect to Redis:", error);
            redisDisabled = true;
            return null;
        })
        .finally(() => {
            redisConnectPromise = null;
        });

    return redisConnectPromise;
}

export function getDashboardCacheTtlSeconds() {
    const parsed = Number(process.env.DASHBOARD_CACHE_TTL_SECONDS || 120);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
}
