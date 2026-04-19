"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import Loading from "@/components/Loading";
import { RainbowButton } from "@/components/ui/magic/rainbow-button";

type RecommendationRow = {
    id: string;
    type: string;
    priority: "low" | "medium" | "high";
    priority_score: number | null;
    root_cause: string | null;
    secondary_causes: string[] | null;
    reason: string | null;
    query_intent: string | null;
    confidence: number | null;
    evidence: Record<string, any> | null;
    content: {
        format?: string;
        title?: string;
        outline?: string[];
        content_brief?: string;
        full_text?: string;
        natural_brand_placement_notes?: string[];
    } | null;
    distribution:
        | Array<{
                platform: string;
                fit_score: number;
                reason: string;
                instructions: string;
                content_adaptation: string;
            }>
        | null;
    brand_name: string | null;
    query_text: string | null;
    query_type: string | null;
    source_type: string | null;
    created_at: string;
};

const priorityStyles: Record<string, string> = {
    low: "bg-zinc-100 text-zinc-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-700",
};

function formatScore(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "N/A";
    }
    return value.toFixed(2);
}

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<RecommendationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    async function loadRecommendations() {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get("/recommendations");
            setRecommendations(res.data?.data ?? []);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load recommendations");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRecommendations();
    }, []);

    async function runRecommendations() {
        try {
            setRefreshing(true);
            await axios.post("/recommendations/run", {});
            setTimeout(() => {
                loadRecommendations();
                setRefreshing(false);
            }, 1800);
        } catch {
            setRefreshing(false);
            setError("Failed to start recommendation generation");
        }
    }

    async function resolveRecommendation(id: string) {
        try {
            setActionLoadingId(id);
            await axios.post(`/recommendations/${id}/resolve`, {});
            await loadRecommendations();
        } catch {
            setError("Failed to resolve recommendation");
        } finally {
            setActionLoadingId(null);
        }
    }

    const summary = useMemo(() => {
        const highPriority = recommendations.filter((item) => item.priority === "high").length;
        const withContent = recommendations.filter((item) => item.content?.title).length;
        const avgConfidence =
            recommendations.reduce((sum, item) => sum + Number(item.confidence || 0), 0) /
            (recommendations.length || 1);

        return {
            total: recommendations.length,
            highPriority,
            withContent,
            avgConfidence,
        };
    }, [recommendations]);

    return (
        <main className="pt-28 sm:pt-0 space-y-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryCard title="Total" value={String(summary.total)} />
                <SummaryCard title="High Priority" value={String(summary.highPriority)} />
                <SummaryCard title="With Content" value={String(summary.withContent)} />
                <SummaryCard title="Avg Confidence" value={formatScore(summary.avgConfidence)} />
            </div>

            <section className="w-full">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold italic pb-2">Recommendations.</h2>
                        {loading && <Loading />}
                    </div>

                    <RainbowButton onClick={runRecommendations} disabled={refreshing}>
                        {refreshing ? "Generating..." : "Generate Recommendations"}
                    </RainbowButton>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                {!loading && recommendations.length === 0 && !error && (
                    <p className="text-sm text-gray-500">
                        No recommendations yet. Run the engine to generate structured visibility recommendations.
                    </p>
                )}

                <div className="space-y-3">
                    {recommendations.map((item) => (
                        <div key={item.id} className="rounded-lg border-t border-zinc-300 bg-white p-4 shadow-sm space-y-4">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">
                                            {item.content?.title || item.reason || item.type}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${priorityStyles[item.priority] || priorityStyles.low}`}>
                                            {item.priority}
                                        </span>
                                        {item.root_cause && (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                                {item.root_cause}
                                            </span>
                                        )}
                                        {item.source_type && (
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                                                {item.source_type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                        <span>Brand: {item.brand_name || "Unknown"}</span>
                                        <span>Query: {item.query_text || "N/A"}</span>
                                        <span>Intent: {item.query_intent || "unknown"}</span>
                                        <span>Confidence: {formatScore(item.confidence)}</span>
                                        <span>Priority score: {formatScore(item.priority_score)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => resolveRecommendation(item.id)}
                                    disabled={actionLoadingId === item.id}
                                    className="rounded-lg border border-black bg-black px-3 py-2 text-xs text-white hover:opacity-90 disabled:opacity-50"
                                >
                                    {actionLoadingId === item.id ? "Resolving..." : "Resolve"}
                                </button>
                            </div>

                            <p className="text-sm text-gray-700">{item.reason}</p>

                            {item.content && (
                                <div className="rounded-lg bg-gray-100 p-3 space-y-2">
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                        <span>Format: {item.content.format || "N/A"}</span>
                                        <span>Type: {item.type}</span>
                                        <span>Query type: {item.query_type || "N/A"}</span>
                                    </div>

                                    {item.content.outline && item.content.outline.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-zinc-800">Outline</p>
                                            <ul className="mt-1 list-disc pl-4 text-sm text-gray-700">
                                                {item.content.outline.map((point, index) => (
                                                    <li key={`${item.id}-outline-${index}`}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {item.content.content_brief && (
                                        <div>
                                            <p className="text-xs font-medium text-zinc-800">Content Brief</p>
                                            <p className="mt-1 text-sm text-gray-700">{item.content.content_brief}</p>
                                        </div>
                                    )}

                                    {item.content.full_text && (
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-zinc-800 font-medium">
                                                Full Content
                                            </summary>
                                            <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 text-xs text-gray-700 border border-gray-200">
                                                {item.content.full_text}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {item.distribution && item.distribution.length > 0 && (
                                <div className="grid gap-2 md:grid-cols-2">
                                    {item.distribution.map((channel, index) => (
                                        <div key={`${item.id}-channel-${index}`} className="rounded-lg border bg-white p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium">{channel.platform}</span>
                                                <span className="text-xs text-gray-500">
                                                    Fit: {formatScore(channel.fit_score)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-600">{channel.reason}</p>
                                            <p className="mt-2 text-xs text-gray-700">
                                                <span className="font-medium">How to post:</span> {channel.instructions}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-700">
                                                <span className="font-medium">Adaptation:</span> {channel.content_adaptation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {item.evidence && (
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-gray-700">Evidence</summary>
                                    <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 text-gray-600 border border-gray-200">
                                        {JSON.stringify(item.evidence, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl bg-gray-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-800">{title}</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900">{value}</h2>
        </div>
    );
}
