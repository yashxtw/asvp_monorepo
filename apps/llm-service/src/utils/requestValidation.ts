import { RecommendationEngineInput } from "../providers/types";
import { HttpError } from "./errors";

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalRecord(value: unknown) {
    return value === undefined || value === null || (typeof value === "object" && !Array.isArray(value));
}

function isNullableNumber(value: unknown) {
    return value === undefined || value === null || (typeof value === "number" && Number.isFinite(value));
}

export function validateRecommendationInput(payload: unknown): RecommendationEngineInput {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new HttpError(400, "Request body must be a JSON object", "invalid_payload");
    }

    const input = payload as Record<string, unknown>;

    if (typeof input.query !== "string" || input.query.trim().length === 0) {
        throw new HttpError(400, "Field 'query' is required", "invalid_query");
    }

    if (typeof input.brand !== "string" || input.brand.trim().length === 0) {
        throw new HttpError(400, "Field 'brand' is required", "invalid_brand");
    }

    if (input.competitors_detected !== undefined && !isStringArray(input.competitors_detected)) {
        throw new HttpError(400, "Field 'competitors_detected' must be an array of strings", "invalid_competitors");
    }

    if (input.previous_recommendations !== undefined && !Array.isArray(input.previous_recommendations)) {
        throw new HttpError(400, "Field 'previous_recommendations' must be an array", "invalid_previous_recommendations");
    }

    if (input.entities !== undefined && !Array.isArray(input.entities)) {
        throw new HttpError(400, "Field 'entities' must be an array", "invalid_entities");
    }

    if (input.mentions_brand !== undefined && typeof input.mentions_brand !== "boolean") {
        throw new HttpError(400, "Field 'mentions_brand' must be a boolean", "invalid_mentions_brand");
    }

    const nullableNumberFields = ["visibility_score", "sentiment_score", "prominence_score"] as const;
    for (const field of nullableNumberFields) {
        if (!isNullableNumber(input[field])) {
            throw new HttpError(400, `Field '${field}' must be a number or null`, `invalid_${field}`);
        }
    }

    const optionalRecordFields = [
        "historical_trend",
        "source_comparison",
        "website_gap_analysis",
        "alert_context",
    ] as const;
    for (const field of optionalRecordFields) {
        if (!isOptionalRecord(input[field])) {
            throw new HttpError(400, `Field '${field}' must be an object or null`, `invalid_${field}`);
        }
    }

    return {
        ...input,
        query: input.query.trim(),
        brand: input.brand.trim(),
    } as RecommendationEngineInput;
}
