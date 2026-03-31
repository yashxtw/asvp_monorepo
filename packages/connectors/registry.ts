import { ChatGPTConnector } from "./chatgpt/ChatGPTConnector";
import { ClaudeConnector } from "./claude/ClaudeConnector";
import { GoogleAIOConnector } from "./googleAIO/GoogleAIOConnector";
import { GeminiConnector } from "./gemini/GeminiConnector";

export const CONNECTOR_REGISTRY = {
    chatgpt: new ChatGPTConnector(),
    claude: new ClaudeConnector(),
    google_aio: new GoogleAIOConnector(),
    gemini: new GeminiConnector()
};
