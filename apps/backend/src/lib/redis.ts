import { createClient } from "redis";

type AppRedisClient = ReturnType<typeof createClient>;

let redisClient: AppRedisClient | null = null;
let redisConnectPromise: Promise<AppRedisClient | null> | null = null;
let redisDisabled = false;

function getRedisConnectionUrl() {
    const url = process.env.REDIS_URL?.trim();
    if (!url) return null;
    return url;
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
