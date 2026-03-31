"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loading from "@/components/Loading";

type AnswerEntity = {
    canonical_name?: string;
    name?: string;
    type?: string;
};

type AnswerRow = {
    id: string;
    run_id: string;
    raw_text: string;
    created_at: string;
    mentions_brand: boolean;
    visibility_score: number | null;
    sentiment_label: string | null;
    sentiment_score: number | null;
    prominence_score: number | null;
    main_snippet: string | null;
    entities: AnswerEntity[] | null;
    brand_id: string | null;
};

export default function AnalyticsPage() {
    const [answers, setAnswers] = useState<AnswerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`${process.env.NEXT_PUBLIC_API_BASE}/dashboard/answers`, {
                withCredentials: true,
            })
            .then((res) => {
                setAnswers(res.data?.data ?? []);
            })
            .catch(() => {
                setError("Failed to load answers");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <main className="pt-28 sm:pt-0 space-y-4">
            <div>
                <h1 className="text-xl font-semibold">Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Parsed answers returned by your AI monitoring runs.
                </p>
            </div>

            {loading && (
                <div className="pt-4">
                    <Loading />
                </div>
            )}

            {error && !loading && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!loading && !error && (
                <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-50 text-left">
                            <tr className="border-b">
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium">Run</th>
                                <th className="px-4 py-3 font-medium">Snippet / Raw</th>
                                <th className="px-4 py-3 font-medium">Brand Mention</th>
                                <th className="px-4 py-3 font-medium">Visibility</th>
                                <th className="px-4 py-3 font-medium">Sentiment</th>
                                <th className="px-4 py-3 font-medium">Prominence</th>
                                <th className="px-4 py-3 font-medium">Entities</th>
                            </tr>
                        </thead>
                        <tbody>
                            {answers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                        No answers found.
                                    </td>
                                </tr>
                            )}

                            {answers.map((answer) => (
                                <tr key={answer.id} className="border-b align-top">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                        {new Date(answer.created_at).toLocaleString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600 break-all">
                                        {answer.run_id}
                                    </td>
                                    <td className="px-4 py-3 max-w-xl">
                                        <div className="font-medium text-zinc-900">
                                            {answer.main_snippet || "No main snippet"}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap wrap-break-word line-clamp-4">
                                            {answer.raw_text}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                answer.mentions_brand
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-zinc-100 text-zinc-600"
                                            }`}
                                        >
                                            {answer.mentions_brand ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {answer.visibility_score ?? "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="capitalize">{answer.sentiment_label ?? "unknown"}</div>
                                        <div className="text-gray-500">{answer.sentiment_score ?? "N/A"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {answer.prominence_score ?? "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div>{answer.entities?.length ?? 0} entities</div>
                                        <div className="mt-1 text-gray-500">
                                            {(answer.entities ?? [])
                                                .slice(0, 3)
                                                .map((entity) => entity.canonical_name || entity.name || "Unknown")
                                                .join(", ") || "None"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
