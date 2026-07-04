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
                <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
                <p className="text-sm text-zinc-500 font-medium">Fetching engine evaluations...</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="w-full max-w-xl mx-auto">
                <div className="p-8 text-center">
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        No results were generated. This could be due to missing integration keys or database sync delays.
                    </p>
                    <button
                        onClick={onNext}
                        className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                    >
                        Skip to Analytics
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-4">
                    Step 4
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Live responses</h2>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                    Compare how each AI engine answers your queries side-by-side.
                </p>
            </div>

            {results.map((group) => (
                <div
                    key={group.execution_group_id}
                    className="p-6 md:p-8 space-y-6"
                >
                    <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Query text</span>
                            <h3 className="text-base font-bold text-zinc-950 mt-0.5">{group.query_text}</h3>
                        </div>
                        <span className="text-xs text-zinc-500 font-semibold bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-lg self-start md:self-auto">
                            Brand: <strong className="text-zinc-900 font-bold">{group.brand_name}</strong>
                        </span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {group.answers.map((answer: any) => {
                            const meta = sourceMeta[answer.source_type] || {
                                label: answer.source_type,
                                favicon: "",
                            };
                            const isExpanded = expandedAnswerId === answer.id;

                            return (
                                <div
                                    key={answer.id}
                                    className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {meta.favicon && (
                                                    <img
                                                        src={meta.favicon}
                                                        alt={meta.label}
                                                        className="h-4 w-4 object-contain"
                                                    />
                                                )}
                                                <span className="text-xs font-bold text-zinc-900">
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                    answer.mentions_brand
                                                        ? "bg-green-50 text-green-700 border border-green-200"
                                                        : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                                                }`}
                                            >
                                                {answer.mentions_brand ? "Mentioned" : "Not Mentioned"}
                                            </span>
                                        </div>

                                        {/* Metrics row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-white border border-zinc-200/80 p-2 text-center shadow-sm">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Visibility</span>
                                                <p className="text-sm font-extrabold text-zinc-900 mt-0.5">{answer.visibility_score ?? 0}</p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-zinc-200/80 p-2 text-center shadow-sm">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Sentiment</span>
                                                <p className="text-xs font-bold text-zinc-900 mt-0.5 capitalize">{answer.sentiment_label || "neutral"}</p>
                                            </div>
                                            <div className="rounded-lg bg-white border border-zinc-200/80 p-2 text-center shadow-sm">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Prominence</span>
                                                <p className="text-sm font-extrabold text-zinc-900 mt-0.5">{answer.prominence_score ?? 0}</p>
                                            </div>
                                        </div>

                                        {/* Main snippet */}
                                        <div className="space-y-1">
                                            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Key Citation Snippet</span>
                                            <p className="text-xs font-medium text-zinc-700 leading-relaxed bg-white border border-zinc-150 p-3 rounded-lg italic shadow-sm">
                                                &ldquo;{answer.main_snippet || "No brand citation snippet found."}&rdquo;
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collapsible raw text */}
                                    <div className="mt-4 pt-3 border-t border-zinc-200">
                                        <button
                                            onClick={() => toggleExpand(answer.id)}
                                            className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-800 transition font-semibold"
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
                                            <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed bg-white border border-zinc-200 p-3 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
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

            <div className="flex justify-end pt-4">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:scale-[1.01]"
                >
                    Next: View Analytics
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
