"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import Loading from "@/components/Loading";

type AnswerEntity = {
    canonical_name?: string;
    name?: string;
    type?: string;
};

type SourceAnswer = {
    id: string;
    run_id: string;
    source_id: string;
    source_type: string;
    raw_text: string;
    created_at: string;
    mentions_brand: boolean;
    visibility_score: number | null;
    sentiment_label: string | null;
    sentiment_score: number | null;
    prominence_score: number | null;
    main_snippet: string | null;
    entities: AnswerEntity[] | null;
};

type ExecutionGroup = {
    execution_group_id: string;
    query_id: string;
    query_text: string;
    brand_id: string;
    brand_name: string;
    created_at: string;
    answers: SourceAnswer[];
};

type Brand = {
    id: string;
    brand_name: string;
};

const sourceMeta: Record<string, { label: string; accent: string }> = {
    google_aio: {
        label: "Google AIO",
        accent: "border-blue-200",
    },
    gemini: {
        label: "Gemini",
        accent: "border-emerald-200",
    },
    chatgpt: {
        label: "ChatGPT",
        accent: "border-zinc-300",
    },
    claude: {
        label: "Claude",
        accent: "border-orange-200",
    },
};

export default function AnalyticsPage() {
    const [groups, setGroups] = useState<ExecutionGroup[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrandId, setSelectedBrandId] = useState("");
    const [selectedSource, setSelectedSource] = useState("");

    useEffect(() => {
        axios
            .get("/brands")
            .then((res) => setBrands(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedBrandId) params.set("brand_id", selectedBrandId);
        if (selectedSource) params.set("source", selectedSource);

        setLoading(true);
        setError(null);

        axios
            .get(`/dashboard/answers${params.toString() ? `?${params.toString()}` : ""}`)
            .then((res) => {
                setGroups(res.data?.data ?? []);
            })
            .catch(() => {
                setError("Failed to load analytics executions");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedBrandId, selectedSource]);

    const summary = useMemo(() => {
        const allAnswers = groups.flatMap((group) => group.answers);
        const sourceCounts = allAnswers.reduce<Record<string, number>>((acc, answer) => {
            acc[answer.source_type] = (acc[answer.source_type] || 0) + 1;
            return acc;
        }, {});

        return {
            executions: groups.length,
            answers: allAnswers.length,
            comparedSources: Object.keys(sourceCounts).length,
            sourceCounts,
        };
    }, [groups]);

    return (
        <main className="pt-28 sm:pt-0 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl italic font-semibold">Analytics.</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Compare each query execution side-by-side across Gemini, Claude, ChatGPT, and Google AIO.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        className="px-3 py-2 text-sm"
                    >
                        <option value="">All brands</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.brand_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="px-3 py-2 text-sm"
                    >
                        <option value="">All sources</option>
                        <option value="google_aio">Google AIO</option>
                        <option value="gemini">Gemini</option>
                        <option value="chatgpt">ChatGPT</option>
                        <option value="claude">Claude</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryCard label="Execution Groups" value={summary.executions} />
                <SummaryCard label="Source Answers" value={summary.answers} />
                <SummaryCard label="Sources Compared" value={summary.comparedSources} />
                <SummaryCard
                    label="Coverage"
                    value={
                        Object.entries(summary.sourceCounts)
                            .map(([source, count]) => `${sourceMeta[source]?.label || source}: ${count}`)
                            .join(" | ") || "No data"
                    }
                    compact
                />
            </div>

            {loading && (
                <div className="pt-4">
                    <Loading />
                </div>
            )}

            {error && !loading && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!loading && !error && groups.length === 0 && (
                <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
                    No execution groups found yet.
                </div>
            )}

            {!loading && !error && groups.length > 0 && (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <section
                            key={group.execution_group_id}
                            className="rounded-2xl bg-white border-t border-zinc-300 p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-2 border-b border-zinc-300 pb-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-semibold">{group.query_text}</h2>
                                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                                            {group.brand_name}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Execution group: {group.execution_group_id}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {new Date(group.created_at).toLocaleString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>

                            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                                {group.answers.map((answer) => {
                                    const meta = sourceMeta[answer.source_type] || {
                                        label: answer.source_type,
                                        accent: "border-zinc-300",
                                    };

                                    return (
                                        <article
                                            key={answer.id}
                                            className={`rounded-xl border p-4 ${meta.accent}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <SourceLogo source={answer.source_type} />
                                                        <span className="text-xs font-medium text-zinc-700">
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs ${
                                                            answer.mentions_brand
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-zinc-100 text-zinc-600"
                                                        }`}
                                                    >
                                                        {answer.mentions_brand ? "Brand mentioned" : "No mention"}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(answer.created_at).toLocaleTimeString("en-IN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 md:grid-cols-4">
                                                <MetricPill label="Visibility" value={answer.visibility_score ?? "N/A"} />
                                                <MetricPill label="Sentiment" value={answer.sentiment_label ?? "unknown"} />
                                                <MetricPill label="Score" value={answer.sentiment_score ?? "N/A"} />
                                                <MetricPill label="Prominence" value={answer.prominence_score ?? "N/A"} />
                                            </div>

                                            <div className="mt-3">
                                                <p className="text-sm font-medium text-zinc-900">
                                                    {answer.main_snippet || "No main snippet extracted"}
                                                </p>
                                                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-xs text-gray-600">
                                                    {answer.raw_text}
                                                </p>
                                            </div>

                                            <div className="mt-3 text-xs text-gray-500">
                                                Top entities:{" "}
                                                {(answer.entities ?? [])
                                                    .slice(0, 4)
                                                    .map((entity) => entity.canonical_name || entity.name || "Unknown")
                                                    .join(", ") || "None"}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </main>
    );
}

function SummaryCard({
    label,
    value,
    compact = false,
}: {
    label: string;
    value: string | number;
    compact?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-white border-t border-zinc-300 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-700">{label}</p>
            <p className={`mt-2 font-semibold text-zinc-900 ${compact ? "text-sm leading-5" : "text-3xl"}`}>
                {value}
            </p>
        </div>
    );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-zinc-50 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
        </div>
    );
}

function SourceLogo({ source }: { source: string }) {
    const baseClass =
        "flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm";

    const logoSrc: Record<string, string> = {
        google_aio: "https://www.google.com/favicon.ico",
        gemini: "https://gemini.google.com/favicon.ico",
        chatgpt: "https://chatgpt.com/favicon.ico",
        claude: "https://claude.ai/favicon.ico",
    };

    const borderClass =
        source === "google_aio"
            ? "border-blue-200"
            : source === "gemini"
              ? "border-emerald-200"
              : source === "claude"
                ? "border-orange-200"
                : "border-zinc-300";

    const src = logoSrc[source];

    return (
        <div className={`${baseClass} ${borderClass}`} aria-label={source}>
            {src ? (
                <img
                    src={src}
                    alt={`${source} logo`}
                    className="h-4.5 w-4.5 object-contain"
                    onError={(event) => {
                        const target = event.currentTarget;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLSpanElement | null;
                        if (fallback) {
                            fallback.style.display = "inline-flex";
                        }
                    }}
                />
            ) : null}
            <span
                className="hidden text-xs font-semibold text-zinc-700"
                style={{ display: src ? "none" : "inline-flex" }}
            >
                {source.slice(0, 1).toUpperCase()}
            </span>
        </div>
    );
}
