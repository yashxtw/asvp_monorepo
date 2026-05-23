import express, { NextFunction, Request, Response } from "express";
import http from "http";
import recommendRoute from "./routes/recommend";
import { llmRateLimiter } from "./middleware/rateLimit";
import { config } from "./config";
import { getProvider } from "./providers";
import { getCacheStats } from "./cache/dedupe";
import { HttpError } from "./utils/errors";

const app = express();
let isShuttingDown = false;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: config.requestBodyLimit }));

app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
        console.log("[HTTP]", {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
        });
    });
    next();
});

app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "llm-service",
        env: config.nodeEnv,
        uptimeSec: Math.round(process.uptime()),
        cache: getCacheStats(),
    });
});

app.get("/ready", (_req, res) => {
    if (isShuttingDown) {
        return res.status(503).json({ ok: false, status: "shutting_down" });
    }

    try {
        getProvider();
        return res.json({ ok: true, status: "ready" });
    } catch (error) {
        console.error("Readiness check failed:", error);
        return res.status(503).json({ ok: false, status: "not_ready" });
    }
});

app.use((req, res, next) => {
    if (isShuttingDown) {
        return res.status(503).json({ error: "Service is shutting down", code: "service_unavailable" });
    }

    next();
});

app.use(llmRateLimiter);
app.use("/", recommendRoute);

app.use((_req, res) => {
    res.status(404).json({ error: "Route not found", code: "not_found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({ error: "Invalid JSON body", code: "invalid_json" });
    }

    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
        });
    }

    console.error("Unhandled llm-service error:", error);
    return res.status(500).json({
        error: "Internal server error",
        code: "internal_error",
    });
});

const server = http.createServer(app);

server.headersTimeout = config.requestTimeoutMs + 5000;
server.requestTimeout = config.requestTimeoutMs;
server.keepAliveTimeout = 5000;

const PORT = Number(process.env.PORT) || config.port || 5050;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`LLM service running on port ${PORT}`);
});

function shutdown(signal: string) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}. Shutting down llm-service...`);

    const forceCloseTimer = setTimeout(() => {
        console.error("Force exiting after shutdown timeout");
        process.exit(1);
    }, config.shutdownTimeoutMs);

    server.close((error) => {
        clearTimeout(forceCloseTimer);

        if (error) {
            console.error("Failed to close server cleanly:", error);
            process.exit(1);
        }

        console.log("llm-service stopped cleanly");
        process.exit(0);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception in llm-service:", error);
    shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection in llm-service:", reason);
});
