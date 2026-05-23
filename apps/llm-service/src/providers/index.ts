import { GeminiProvider } from "./gemini";
import { LLMProvider } from "./types";
import { config } from "../config";

let providerInstance: LLMProvider | null = null;

function createProvider(): LLMProvider {
    switch (config.llmProvider) {
        case "gemini":
            return new GeminiProvider();
        default:
            throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
    }
}

export function getProvider(): LLMProvider {
    if (!providerInstance) {
        providerInstance = createProvider();
    }

    return providerInstance;
}
