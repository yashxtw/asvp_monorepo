export type AISource =
    | "google_aio"
    | "chatgpt"
    | "claude"
    | "gemini";

export interface ConnectorExecuteInput {
    runId: string;
    query: string;
    queryType: "brand" | "category" | "competitor" | "product";
    locale?: string;
}

export interface ConnectorExecuteOutput {
    source: AISource;

    raw: {
        text: string;           // visible AI answer
        html?: string;          // full DOM snapshot (if browser)
        htmlPath?: string;      // snapshot path (local or S3)
        screenshotUrl?: string; // snapshot path (local or S3)
    };

    metadata: {
        appeared: boolean;      // did AI answer exist?
        position?: number;      // prominence (heuristic)
        container?: string;     // DOM / UI container name
        model?: string;         // GPT-4, Gemini, etc.
        latencyMs: number;
    };

    debug: {
        fetchedAt: string;
        executionType: "api" | "browser";
        version: string; // connector version
    };
}

export interface AISourceConnector {
    source: AISource;
    execute(
        input: ConnectorExecuteInput
    ): Promise<ConnectorExecuteOutput>;
}

export type ConnectorError =
    | { type: "RATE_LIMITED"; retryAfter?: number }
    | { type: "CAPTCHA"; screenshotUrl?: string }
    | { type: "NO_AI_OVERVIEW" }
    | { type: "DOM_CHANGED" }
    | { type: "NETWORK_ERROR" };

