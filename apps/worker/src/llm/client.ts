import axios from "axios";
import path from "path";
import dotenv from "dotenv";

export type RecommendationEngineRecord = {
    query: string;
    brand: string;
    source_type: string;
    query_intent: string;
    root_cause: string;
    secondary_causes: string[];
    recommendation_type: string;
    reason: string;
    evidence: Record<string, any>;
    content: {
        format: string;
        title: string;
        outline: string[];
        content_brief: string;
        full_text: string;
        natural_brand_placement_notes: string[];
    };
    distribution: Array<{
        platform: string;
        fit_score: number;
        reason: string;
        instructions: string;
        content_adaptation: string;
    }>;
    priority_score: number;
    priority: "high" | "medium" | "low";
    confidence: number;
};

export type RecommendOutput = {
    recommendations: RecommendationEngineRecord[];
};

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const LLM_BASE_URL = process.env.LLM_SERVICE_URL || "http://localhost:5050";
const LLM_TIMEOUT_MS = 10_000;

export async function callLLMRecommend(payload: any): Promise<RecommendOutput> {
    const res = await axios.post<RecommendOutput>(`${LLM_BASE_URL}/recommend`, payload, {
        timeout: LLM_TIMEOUT_MS
    });
    return res.data;
}
