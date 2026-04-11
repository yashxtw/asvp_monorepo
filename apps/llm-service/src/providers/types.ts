export type RecommendationEngineInput = {
    query: string;
    query_type?: string;
    query_intent?: string;
    source_type?: string;
    brand: string;
    brand_id?: string;
    mentions_brand?: boolean;
    visibility_score?: number | null;
    sentiment_label?: string | null;
    sentiment_score?: number | null;
    prominence_score?: number | null;
    entities?: Array<Record<string, any>>;
    competitors_detected?: string[];
    raw_text?: string;
    historical_trend?: Record<string, any> | null;
    source_comparison?: Record<string, any> | null;
    previous_recommendations?: Array<Record<string, any>>;
    website_gap_analysis?: Record<string, any> | null;
    alert_context?: Record<string, any> | null;
};

export type RecommendationEngineRecord = {
    query: string;
    brand: string;
    source_type: string;
    query_intent:
        | "listicle"
        | "comparison"
        | "informational"
        | "navigational"
        | "commercial_investigation"
        | "association";
    root_cause: string;
    secondary_causes: string[];
    recommendation_type: string;
    reason: string;
    evidence: {
        mentions_brand: boolean;
        visibility_score: number | null;
        sentiment_label: string | null;
        sentiment_score: number | null;
        prominence_score: number | null;
        competitors_detected: string[];
        observed_gap: string;
        raw_text_signals: string[];
        website_gap_signals: string[];
    };
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

export interface LLMProvider {
    recommend(input: RecommendationEngineInput): Promise<RecommendOutput>;
}
