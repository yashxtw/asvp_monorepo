import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

function parsePort(value: string | undefined, fallback: number) {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`Invalid PORT value: ${value}`);
    }

    return parsed;
}

function parsePositiveInt(name: string, value: string | undefined, fallback: number) {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${name} value: ${value}`);
    }

    return parsed;
}

const llmProvider = process.env.LLM_PROVIDER || "gemini";

if (llmProvider === "gemini" && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER is gemini");
}

export const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parsePort(process.env.PORT, 5050),
    llmProvider,
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "1mb",
    requestTimeoutMs: parsePositiveInt("REQUEST_TIMEOUT_MS", process.env.REQUEST_TIMEOUT_MS, 30000),
    shutdownTimeoutMs: parsePositiveInt("SHUTDOWN_TIMEOUT_MS", process.env.SHUTDOWN_TIMEOUT_MS, 10000),
    cacheTtlMs: parsePositiveInt("LLM_CACHE_TTL_MS", process.env.LLM_CACHE_TTL_MS, 5 * 60 * 1000),
    cacheMaxEntries: parsePositiveInt("LLM_CACHE_MAX_ENTRIES", process.env.LLM_CACHE_MAX_ENTRIES, 500),
};

export type AppConfig = typeof config;
