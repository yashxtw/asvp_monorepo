import { getDashboardCacheTtlSeconds, getRedisClient } from "./redis";

function stablePart(value: unknown) {
    if (value === undefined || value === null || value === "") {
        return "all";
    }

    return String(value);
}

export function buildDashboardCacheKey(
    routeName: string,
    params: Record<string, unknown>
) {
    const serialized = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${stablePart(value)}`)
        .join("|");

    return `dashboard:${routeName}:${serialized}`;
}

export async function getCachedDashboardResponse<T>(key: string) {
    const redis = await getRedisClient();
    if (!redis) {
        console.log(`[dashboard-cache] bypass no-redis key=${key}`);
        return null;
    }

    const cached = await redis.get(key);
    if (!cached) {
        console.log(`[dashboard-cache] miss key=${key}`);
        return null;
    }

    try {
        console.log(`[dashboard-cache] hit key=${key}`);
        return JSON.parse(cached) as T;
    } catch {
        console.log(`[dashboard-cache] invalid-json key=${key}`);
        return null;
    }
}

export async function setCachedDashboardResponse<T>(key: string, value: T) {
    const redis = await getRedisClient();
    if (!redis) {
        console.log(`[dashboard-cache] skip-set no-redis key=${key}`);
        return;
    }

    await redis.set(key, JSON.stringify(value), {
        EX: getDashboardCacheTtlSeconds(),
    });
    console.log(`[dashboard-cache] set key=${key}`);
}

export async function deleteDashboardCacheKey(key: string) {
    const redis = await getRedisClient();
    if (!redis) {
        console.log(`[dashboard-cache] skip-del no-redis key=${key}`);
        return;
    }

    await redis.del(key);
    console.log(`[dashboard-cache] del key=${key}`);
}
