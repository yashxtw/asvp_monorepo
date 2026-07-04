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
        <div className="w-full max-w-xl mx-auto">
            <div className="p-8">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-6">
                    Step 2
                </div>

                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Add search queries</h2>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                    What would a potential customer search to find your product? Add up to 2 queries to test how {brandName} is cited.
                </p>

                {/* Add query form */}
                {queriesList.length < 2 ? (
                    <form onSubmit={handleAddQuery} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Query Text
                            </label>
                            <input
                                type="text"
                                required
                                value={newQueryText}
                                onChange={(e) => setNewQueryText(e.target.value)}
                                placeholder="e.g. Best database for serverless apps"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Query Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["brand", "category", "competitor"] as const).map((type) => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setNewQueryType(type)}
                                        className={`rounded-lg py-2.5 text-xs font-semibold border transition ${
                                            newQueryType === type
                                                ? "bg-zinc-950 text-white border-zinc-950"
                                                : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
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
                            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                            Add Query
                        </button>
                    </form>
                ) : (
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-600">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400" />
                        <div>
                            <p className="font-semibold text-zinc-900">Maximum queries reached</p>
                            <p className="mt-0.5">You have added 2 queries. Delete one if you'd like to replace it.</p>
                        </div>
                    </div>
                )}

                {/* List of queries */}
                {queriesList.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Your Queries ({queriesList.length}/2)
                        </h3>
                        <div className="space-y-2.5">
                            {queriesList.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">{q.query_text}</p>
                                        <span className="mt-1.5 inline-block rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                            {getQueryTypeLabel(q.query_type)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuery(idx)}
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-4 text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                    </p>
                )}

                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || queriesList.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
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
