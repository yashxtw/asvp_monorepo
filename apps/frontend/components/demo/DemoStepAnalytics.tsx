"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, BarChart2, CheckSquare, MessageSquare, Star } from "lucide-react";
import axios from "@/lib/axios";

type DemoStepAnalyticsProps = {
    sessionId: string;
    onNext: () => void;
};

export default function DemoStepAnalytics({ sessionId, onNext }: DemoStepAnalyticsProps) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get(`/demo/analytics?session_id=${sessionId}`);
                if (res.data?.success) {
                    setAnalytics(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching demo analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
                <p className="text-sm text-zinc-500 font-medium">Aggregating visibility metrics...</p>
            </div>
        );
    }

    const visibility = analytics?.avg_visibility ? Math.round(analytics.avg_visibility * 10) / 10 : 0;
    const mentionRate = analytics?.mention_rate ? Math.round(analytics.mention_rate * 10) / 10 : 0;
    const prominence = analytics?.avg_prominence ? Math.round(analytics.avg_prominence * 10) / 10 : 0;
    const sentiment = analytics?.avg_sentiment ? Math.round(analytics.avg_sentiment * 10) / 10 : 0;

    const getSentimentLabel = (score: number) => {
        if (score > 0.15) return "Positive";
        if (score < -0.15) return "Negative";
        return "Neutral";
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-4">
                    Step 5
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Search visibility metrics</h2>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                    Your brand's visibility and sentiment scores averaged across all AI engines.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Visibility Index */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BarChart2 className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Visibility Index</h4>
                        <p className="mt-2 text-3xl font-extrabold text-zinc-950">{visibility}</p>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                        Visibility weight averaged across all analyzed sources.
                    </p>
                </div>

                {/* Mention Rate */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckSquare className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Mention Rate</h4>
                        <p className="mt-2 text-3xl font-extrabold text-zinc-950">{mentionRate}%</p>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                        Percentage of AI answers mentioning your brand.
                    </p>
                </div>

                {/* Avg Prominence */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Star className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Avg Prominence</h4>
                        <p className="mt-2 text-3xl font-extrabold text-zinc-950">{prominence}</p>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                        Narrative ranking of your citations in the response.
                    </p>
                </div>

                {/* Dominant Sentiment */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                            <MessageSquare className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Brand Sentiment</h4>
                        <p className="mt-2 text-3xl font-extrabold text-zinc-950">{getSentimentLabel(sentiment)}</p>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                        Contextual tone direction (Average: {sentiment}).
                    </p>
                </div>
            </div>

            <div className=" p-6 text-center max-w-xl mx-auto space-y-2">
                <h4 className="text-sm font-bold text-zinc-950">Historical trends note</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                    Historical analytics require ongoing tracking. In the full platform, you'll see visibility charts, market share timelines, and trend vectors plotted daily.
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:scale-[1.01]"
                >
                    Next: Alerts & Recommendations
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
