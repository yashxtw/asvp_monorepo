import {
    AISourceConnector,
    ConnectorExecuteInput,
    ConnectorExecuteOutput
} from "../types";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

type SerpApiGoogleResponse = {
    search_metadata?: {
        id?: string;
    };
    ai_overview?: {
        page_token?: string;
        text_blocks?: unknown[];
        references?: unknown[];
    };
    error?: string;
};

type SerpApiAioResponse = {
    ai_overview?: {
        text_blocks?: unknown[];
        references?: unknown[];
    };
    error?: string;
};

export class GoogleAIOConnector implements AISourceConnector {
    source = "google_aio" as const;

    async execute(
        input: ConnectorExecuteInput
    ): Promise<ConnectorExecuteOutput> {
        const start = Date.now();
        const apiKey = process.env.SERPAPI_KEY;

        if (!apiKey) {
            return {
                source: this.source,
                raw: {
                    text: "SerpAPI not configured"
                },
                metadata: {
                    appeared: false,
                    position: 0,
                    container: "serpapi_disabled",
                    model: "google_ai_overview",
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "google_aio_serpapi_v1"
                }
            };
        }

        const googleDomain = process.env.SERPAPI_GOOGLE_DOMAIN || "google.com";
        const hl = process.env.SERPAPI_HL || "en";
        const gl = process.env.SERPAPI_GL || "us";
        const location = process.env.SERPAPI_LOCATION || "India";

        try {
            const baseSearch = await this.fetchSerpApi<SerpApiGoogleResponse>({
                engine: "google",
                q: input.query,
                location,
                google_domain: googleDomain,
                hl,
                gl,
                api_key: apiKey,
            });

            if (baseSearch.error) {
                return this.buildErrorOutput(baseSearch.error, start);
            }

            const pageToken = baseSearch.ai_overview?.page_token;
            if (!pageToken) {
                return {
                    source: this.source,
                    raw: {
                        text: "Google AI Overview not found"
                    },
                    metadata: {
                        appeared: false,
                        position: 0,
                        container: "serpapi_google_no_aio",
                        model: "google_ai_overview",
                        latencyMs: Date.now() - start
                    },
                    debug: {
                        fetchedAt: new Date().toISOString(),
                        executionType: "api",
                        version: "google_aio_serpapi_v1"
                    }
                };
            }

            const aioResponse = await this.fetchSerpApi<SerpApiAioResponse>({
                engine: "google_ai_overview",
                page_token: pageToken,
                api_key: apiKey,
            });

            if (aioResponse.error) {
                return this.buildErrorOutput(aioResponse.error, start);
            }

            const textBlocks = aioResponse.ai_overview?.text_blocks ?? [];
            const references = aioResponse.ai_overview?.references ?? [];
            const text = this.extractText(textBlocks);

            return {
                source: this.source,
                raw: {
                    text: text || "Google AI Overview returned no text"
                },
                metadata: {
                    appeared: Boolean(text),
                    position: text ? 1 : 0,
                    container: "serpapi_google_ai_overview",
                    model: "google_ai_overview",
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "google_aio_serpapi_v1",
                    searchId: baseSearch.search_metadata?.id,
                    pageToken,
                    referenceCount: references.length,
                } as Record<string, unknown> as ConnectorExecuteOutput["debug"]
            };
        } catch (error) {
            return this.buildErrorOutput(
                error instanceof Error ? error.message : "serpapi_request_failed",
                start
            );
        }
    }

    private async fetchSerpApi<T>(params: Record<string, string>): Promise<T> {
        const searchParams = new URLSearchParams(params);
        const res = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`SerpAPI error: ${res.status} ${body}`);
        }

        return (await res.json()) as T;
    }

    private extractText(textBlocks: unknown[]): string {
        const chunks: string[] = [];

        const walk = (value: unknown) => {
            if (!value) return;

            if (typeof value === "string") {
                const trimmed = value.trim();
                if (trimmed) {
                    chunks.push(trimmed);
                }
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(walk);
                return;
            }

            if (typeof value === "object") {
                for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
                    if (key === "snippet" || key === "text" || key === "title") {
                        walk(nested);
                    } else {
                        walk(nested);
                    }
                }
            }
        };

        walk(textBlocks);

        return Array.from(new Set(chunks)).join(" ").replace(/\s+/g, " ").trim().slice(0, 8000);
    }

    private buildErrorOutput(message: string, start: number): ConnectorExecuteOutput {
        return {
            source: this.source,
            raw: {
                text: `SerpAPI error: ${message}`
            },
            metadata: {
                appeared: false,
                position: 0,
                container: "serpapi_error",
                model: "google_ai_overview",
                latencyMs: Date.now() - start
            },
            debug: {
                fetchedAt: new Date().toISOString(),
                executionType: "api",
                version: "google_aio_serpapi_v1"
            }
        };
    }
}
