"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, Loader2, Info } from "lucide-react";
import axios from "@/lib/axios";

type QueryInput = {
    query_text: string;
    query_type: "brand" | "category" | "competitor";
};

type DemoStepQueriesProps = {
    sessionId: string;
    brandId: string;
    brandName: string;
    onComplete: (queries: any[]) => void;
    onBack: () => void;
};

export default function DemoStepQueries({
    sessionId,
    brandId,
    brandName,
    onComplete,
    onBack,
}: DemoStepQueriesProps) {
    const [queriesList, setQueriesList] = useState<QueryInput[]>([]);
    const [newQueryText, setNewQueryText] = useState("");
    const [newQueryType, setNewQueryType] = useState<"brand" | "category" | "competitor">("brand");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQueryText.trim()) return;

        if (queriesList.length >= 2) {
            setError("You can only add up to 2 queries for the demo.");
            return;
        }

        setQueriesList([
            ...queriesList,
            {
                query_text: newQueryText.trim(),
                query_type: newQueryType,
            },
        ]);
        setNewQueryText("");
        setError(null);
    };

    const handleRemoveQuery = (index: number) => {
        setQueriesList(queriesList.filter((_, idx) => idx !== index));
        setError(null);
    };

    const handleSubmit = async () => {
        if (queriesList.length === 0) {
            setError("Please add at least 1 query to analyze.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post("/demo/queries", {
                session_id: sessionId,
                brand_id: brandId,
                queries: queriesList,
            });

            onComplete(res.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to create queries. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getQueryTypeLabel = (type: string) => {
        switch (type) {
            case "brand":
                return "Brand Presence";
            case "category":
                return "Category/Industry";
            case "competitor":
                return "Competitor Comparison";
            default:
                return type;
        }
    };

    return (
        <div className="mx-auto max-w-xl px-4 py-8">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 md:p-8 shadow-2xl backdrop-blur-md">
                <h2 className="text-xl font-semibold text-white">Step 2: Add Search Queries</h2>
                <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    Add queries your potential customers search to see how AI engines represent **{brandName}**. You can add up to **2 queries** for this demo.
                </p>

                {/* Add query form */}
                {queriesList.length < 2 ? (
                    <form onSubmit={handleAddQuery} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                                Query Text
                            </label>
                            <input
                                type="text"
                                required
                                value={newQueryText}
                                onChange={(e) => setNewQueryText(e.target.value)}
                                placeholder="e.g. Best database for serverless apps"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20 focus:bg-white/10"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                                Query Type
                            </label>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {(["brand", "category", "competitor"] as const).map((type) => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setNewQueryType(type)}
                                        className={`rounded-lg py-2.5 text-xs font-medium border transition ${
                                            newQueryType === type
                                                ? "bg-white text-black border-white"
                                                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        {getQueryTypeLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!newQueryText.trim()}
                            className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                            Add Query
                        </button>
                    </form>
                ) : (
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs text-white/60">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-white/40" />
                        <div>
                            <p className="font-semibold text-white/80">Maximum Queries Added</p>
                            <p className="mt-1">You have added 2 queries. Delete a query if you want to replace it, or proceed to run the analysis.</p>
                        </div>
                    </div>
                )}

                {/* List of queries */}
                {queriesList.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                            Your Queries ({queriesList.length}/2)
                        </h3>
                        <div className="space-y-2">
                            {queriesList.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-white">{q.query_text}</p>
                                        <span className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                                            {getQueryTypeLabel(q.query_type)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuery(idx)}
                                        className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-4 text-xs text-red-400 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

                <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || queriesList.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Next: Run Analysis
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
