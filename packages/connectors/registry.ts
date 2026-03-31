import { ChatGPTConnector } from "./chatgpt/ChatGPTConnector";
import { GoogleAIOConnector } from "./googleAIO/GoogleAIOConnector";
import { GeminiConnector } from "./gemini/GeminiConnector";

export const CONNECTOR_REGISTRY = {
    chatgpt: new ChatGPTConnector(),
    google_aio: new GoogleAIOConnector(),
    gemini: new GeminiConnector()
};
