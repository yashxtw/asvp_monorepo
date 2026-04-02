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
        return null;
    }

    const cached = await redis.get(key);
    if (!cached) {
        return null;
    }

    try {
        return JSON.parse(cached) as T;
    } catch {
        return null;
    }
}

export async function setCachedDashboardResponse<T>(key: string, value: T) {
    const redis = await getRedisClient();
    if (!redis) {
        return;
    }

    await redis.set(key, JSON.stringify(value), {
        EX: getDashboardCacheTtlSeconds(),
    });
}

export async function deleteDashboardCacheKey(key: string) {
    const redis = await getRedisClient();
    if (!redis) {
        return;
    }

    await redis.del(key);
}
