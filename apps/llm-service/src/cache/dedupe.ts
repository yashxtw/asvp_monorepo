import crypto from "crypto";
import { config } from "../config";

const cache = new Map<string, { value: any; expiresAt: number }>();

export function getCacheKey(payload: any): string {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
}

export function getCached(key: string) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}

export function setCached(key: string, value: any) {
    if (cache.size >= config.cacheMaxEntries) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
            cache.delete(oldestKey);
        }
    }

    cache.set(key, {
        value,
        expiresAt: Date.now() + config.cacheTtlMs
    });
}

export function getCacheStats() {
    let activeEntries = 0;
    for (const [, entry] of cache) {
        if (Date.now() <= entry.expiresAt) {
            activeEntries += 1;
        }
    }

    return {
        entries: activeEntries,
        maxEntries: config.cacheMaxEntries,
        ttlMs: config.cacheTtlMs,
    };
}
