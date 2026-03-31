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

type OpenAIResponsesApiResponse = {
    output_text?: string;
    output?: Array<{
        content?: Array<{
            type?: string;
            text?: string;
        }>;
    }>;
    error?: {
        message?: string;
    };
};

export class ChatGPTConnector implements AISourceConnector {
    source = "chatgpt" as const;

    async execute(
        input: ConnectorExecuteInput
    ): Promise<ConnectorExecuteOutput> {
        const start = Date.now();
        const apiKey = process.env.OPENAI_API_KEY;
        const apiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/responses";
        const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

        if (!apiKey) {
            return {
                source: this.source,
                raw: {
                    text: "OpenAI API not configured"
                },
                metadata: {
                    appeared: false,
                    position: 0,
                    container: "openai_disabled",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "chatgpt_api_v1"
                }
            };
        }

        try {
            const text = await this.callOpenAI(apiUrl, apiKey, model, input.query);

            return {
                source: this.source,
                raw: {
                    text
                },
                metadata: {
                    appeared: Boolean(text),
                    position: text ? 1 : 0,
                    container: "openai_responses_api",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "chatgpt_api_v1"
                }
            };
        } catch (error) {
            return {
                source: this.source,
                raw: {
                    text: `OpenAI API error: ${error instanceof Error ? error.message : "request_failed"}`
                },
                metadata: {
                    appeared: false,
                    position: 0,
                    container: "openai_error",
                    model,
                    latencyMs: Date.now() - start
                },
                debug: {
                    fetchedAt: new Date().toISOString(),
                    executionType: "api",
                    version: "chatgpt_api_v1"
                }
            };
        }
    }

    private async callOpenAI(
        apiUrl: string,
        apiKey: string,
        model: string,
        query: string
    ): Promise<string> {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                input: query,
            })
        });

        const data = (await res.json()) as OpenAIResponsesApiResponse;

        if (!res.ok) {
            throw new Error(data.error?.message || `HTTP ${res.status}`);
        }

        const fallbackText = (data.output ?? [])
            .flatMap((item) => item.content ?? [])
            .filter((item) => item.type === "output_text")
            .map((item) => item.text ?? "")
            .join(" ")
            .trim();

        return data.output_text?.trim() || fallbackText || "OpenAI API returned no text";
    }
}
