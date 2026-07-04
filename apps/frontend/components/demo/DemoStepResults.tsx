"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, Loader2 } from "lucide-react";
import axios from "@/lib/axios";

type DemoStepResultsProps = {
    sessionId: string;
    onNext: () => void;
};

const sourceMeta: Record<string, { label: string; favicon: string }> = {
    google_aio: {
        label: "Google AIO",
        favicon: "https://www.google.com/favicon.ico",
    },
    gemini: {
        label: "Gemini",
        favicon: "https://gemini.google.com/favicon.ico",
    },
    chatgpt: {
        label: "ChatGPT",
        favicon: "https://chatgpt.com/favicon.ico",
    },
    claude: {
        label: "Claude",
        favicon: "https://claude.ai/favicon.ico",
    },
};

export default function DemoStepResults({ sessionId, onNext }: DemoStepResultsProps) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAnswerId, setExpandedAnswerId] = useState<string | null>(null);

    // Poll for results
    useEffect(() => {
        let active = true;
        let attempts = 0;

        const checkResults = async () => {
            try {
                const res = await axios.get(`/demo/results?session_id=${sessionId}`);
                if (res.data?.success && res.data.data.length > 0) {
                    if (active) {
                        setResults(res.data.data);
                        setLoading(false);
                    }
                    return true;
                }
            } catch (err) {
                console.error("Error checking demo results:", err);
            }
            return false;
        };

        checkResults();

        const interval = setInterval(async () => {
            attempts++;
            const found = await checkResults();
            if (found || attempts > 20) {
                clearInterval(interval);
                if (active) setLoading(false);
            }
        }, 3000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [sessionId]);

    const toggleExpand = (id: string) => {
        setExpandedAnswerId(expandedAnswerId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                <p className="text-sm text-white/60">Fetching latest model evaluations...</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="mx-auto max-w-xl text-center px-4 py-8">
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-8">
                    <p className="text-sm text-white/60">
                        No results were generated. This could happen if there was a problem executing queries in Temporal or connector keys are missing.
                    </p>
                    <button
                        onClick={onNext}
                        className="mt-6 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-white/90"
                    >
                        Skip to Analytics
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-white">Step 4: Live Answers Analysis</h2>
                <p className="mt-1 text-xs text-white/50">
                    Compare how each model answers your query and cites your brand side-by-side.
                </p>
            </div>

            {results.map((group) => (
                <div
                    key={group.execution_group_id}
                    className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 space-y-4 shadow-xl backdrop-blur-md"
                >
                    <div className="border-b border-white/[0.06] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Query</span>
                            <h3 className="text-base font-semibold text-white mt-0.5">{group.query_text}</h3>
                        </div>
                        <span className="text-[10px] text-white/40">
                            Brand: <strong className="text-white/80 font-medium">{group.brand_name}</strong>
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {group.answers.map((answer: any) => {
                            const meta = sourceMeta[answer.source_type] || {
                                label: answer.source_type,
                                favicon: "",
                            };
                            const isExpanded = expandedAnswerId === answer.id;

                            return (
                                <div
                                    key={answer.id}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {meta.favicon && (
                                                    <img
                                                        src={meta.favicon}
                                                        alt={meta.label}
                                                        className="h-4 w-4 object-contain"
                                                    />
                                                )}
                                                <span className="text-xs font-semibold text-white/90">
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                    answer.mentions_brand
                                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                        : "bg-white/10 text-white/60"
                                                }`}
                                            >
                                                {answer.mentions_brand ? "Mentioned" : "Not Mentioned"}
                                            </span>
                                        </div>

                                        {/* Metrics row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-1.5 text-center">
                                                <span className="text-[9px] uppercase tracking-wider text-white/40">Visibility</span>
                                                <p className="text-xs font-bold text-white mt-0.5">{answer.visibility_score ?? 0}</p>
                                            </div>
                                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-1.5 text-center">
                                                <span className="text-[9px] uppercase tracking-wider text-white/40">Sentiment</span>
                                                <p className="text-xs font-bold text-white mt-0.5 capitalize">{answer.sentiment_label || "neutral"}</p>
                                            </div>
                                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-1.5 text-center">
                                                <span className="text-[9px] uppercase tracking-wider text-white/40">Prominence</span>
                                                <p className="text-xs font-bold text-white mt-0.5">{answer.prominence_score ?? 0}</p>
                                            </div>
                                        </div>

                                        {/* Main snippet */}
                                        <div>
                                            <span className="text-[9px] uppercase tracking-wider text-white/40">Key Citation Snippet</span>
                                            <p className="text-xs font-medium text-white/80 leading-relaxed mt-1 bg-white/[0.01] border border-white/[0.03] p-2 rounded-lg italic">
                                                &ldquo;{answer.main_snippet || "No brand citation snippet found."}&rdquo;
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collapsible raw text */}
                                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                                        <button
                                            onClick={() => toggleExpand(answer.id)}
                                            className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white transition"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    Hide raw response <ChevronUp className="h-3 w-3" />
                                                </>
                                            ) : (
                                                <>
                                                    Show raw response <ChevronDown className="h-3 w-3" />
                                                </>
                                            )}
                                        </button>
                                        {isExpanded && (
                                            <p className="mt-2 text-[10px] text-white/60 leading-relaxed bg-black/30 border border-white/[0.04] p-3 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                {answer.raw_text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 hover:scale-[1.01]"
                >
                    Next: View Analytics
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
