export type ParserInput = {
    raw_text: string;
    brandNames: string[];
    source: "chatgpt" | "claude" | "gemini" | "google_aio" | "unknown";
};

export type ParsedOutput = {
    mentions_brand: boolean;
    confidence: {
        visibility_score: number;
        breakdown: {
            trust: number;
            brandPresence: number;
            sentiment: number;
        };
    };
    sentiment: {
        label: "positive" | "neutral" | "negative";
        score: number;
        similarities: Record<string, number>;
    };
    prominence: {
        score: number;
        first_sentence_index: number;
        best_sentence: string | null;
    };
    entities: Array<{
        entity_id: string;
        name: string;
        canonical_name: string;
        type: string;
        confidence: number;
        relevance: number;
        sentence_index: number | null;
    }>;
};
