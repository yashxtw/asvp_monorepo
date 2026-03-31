const SOURCE_WEIGHTS = {
    chatgpt: 0.85,
    claude: 0.85,
    gemini: 0.8,
    google_aio: 0.8,
    unknown: 0.5
};

type LinkedEntity = {
    entity_id: string;
    name: string;
    canonical_name: string;
    type: "Brand" | "Company" | "Product";
    confidence: number;
    relevance: number;
    sentence_index: number;
};

function sourceTrust(source: keyof typeof SOURCE_WEIGHTS): number {
    return SOURCE_WEIGHTS[source] ?? SOURCE_WEIGHTS.unknown;
}

function structureScore(text: string): number {
    let score = 0.4;
    if (text.includes("\n-") || text.includes("\n�")) score += 0.2;
    if (text.match(/\n\d+\./)) score += 0.2;
    if (text.split("\n\n").length >= 2) score += 0.2;
    return Math.min(score, 1);
}

function depthScore(text: string): number {
    if (text.length > 800) return 1;
    if (text.length > 400) return 0.8;
    if (text.length > 200) return 0.6;
    return 0.4;
}

function brandPresenceScore(
    linkedEntities: LinkedEntity[],
    prominenceScore: number
): number {
    const brandEntities = linkedEntities.filter((e) => e.type === "Brand");

    if (brandEntities.length === 0) return 0;

    const avgRelevance =
        brandEntities.reduce((s, e) => s + e.relevance, 0) /
        brandEntities.length;

    const frequencyBoost = Math.min(brandEntities.length * 0.05, 0.15);

    const score =
        prominenceScore * 0.6 +
        avgRelevance * 0.3 +
        frequencyBoost;

    return Number(Math.min(score, 1).toFixed(3));
}

function answerTrustScore(
    source: keyof typeof SOURCE_WEIGHTS,
    text: string
): number {
    const score =
        sourceTrust(source) * 0.5 +
        structureScore(text) * 0.3 +
        depthScore(text) * 0.2;

    return Number(score.toFixed(3));
}

function sentimentScore(sentiment: {
    score: number;
}): number {
    return Number(((sentiment.score + 1) / 2).toFixed(3));
}

export function computeVisibilityScore(input: {
    source: "chatgpt" | "claude" | "gemini" | "google_aio" | "unknown";
    text: string;
    prominence: {
        score: number;
        first_sentence_index: number;
        best_sentence: string | null;
    };
    linkedEntities: LinkedEntity[];
    sentiment: { score: number };
}) {
    const trust = answerTrustScore(input.source, input.text);
    const brandPresence = brandPresenceScore(
        input.linkedEntities,
        input.prominence.score
    );
    const sentimentVal = sentimentScore(input.sentiment);

    const finalScore = trust * 0.35 + brandPresence * 0.45 + sentimentVal * 0.2;

    return {
        visibility_score: Math.round(finalScore * 100),
        breakdown: {
            trust,
            brandPresence,
            sentiment: sentimentVal
        }
    };
}
