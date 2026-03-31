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

type ClaudeMessageResponse = {
    content?: Array<{
        type?: string;
        text?: string;
    }>;
    error?: {
        message?: string;
    };
};

export class ClaudeConnector implements AISourceConnector {
    source = "claude" as const;

    async execute(
        input: ConnectorExecuteInput
    ): Promise<ConnectorExecuteOutput> {
        const start = Date.now();
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const apiUrl = process.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages";
        const model = process.env.CLAUDE_MODEL || "claude-3-7-sonnet-20250219";

        if (!apiKey) {
            return {
                source: this.source,
                raw: {
                    text: "Anthropic API not configured"
                },
                metadata: {
                    appeared: false,
                    position: 0,
                    container: "claude_disabled",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "claude_api_v1"
                }
            };
        }

        try {
            const text = await this.callClaude(apiUrl, apiKey, model, input.query);

            return {
                source: this.source,
                raw: {
                    text
                },
                metadata: {
                    appeared: Boolean(text),
                    position: text ? 1 : 0,
                    container: "anthropic_messages_api",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "claude_api_v1"
                }
            };
        } catch (error) {
            return {
                source: this.source,
                raw: {
                    text: `Anthropic API error: ${error instanceof Error ? error.message : "request_failed"}`
                },
                metadata: {
                    appeared: false,
                    position: 0,
                    container: "claude_error",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "claude_api_v1"
                }
            };
        }
    }

    private async callClaude(
        apiUrl: string,
        apiKey: string,
        model: string,
        query: string
    ): Promise<string> {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: query
                    }
                ]
            })
        });

        const data = (await res.json()) as ClaudeMessageResponse;

        if (!res.ok) {
            throw new Error(data.error?.message || `HTTP ${res.status}`);
        }

        const text = (data.content ?? [])
            .filter((block) => block.type === "text")
            .map((block) => block.text ?? "")
            .join(" ")
            .trim();

        return text || "Anthropic API returned no text";
    }
}
