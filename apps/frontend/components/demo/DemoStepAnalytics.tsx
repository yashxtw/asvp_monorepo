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
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                <p className="text-sm text-white/60">Structuring brand analytics...</p>
            </div>
        );
    }

    // Default fallbacks in case calculation yielded nulls
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
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-white">Step 5: Brand Analytics</h2>
                <p className="mt-1 text-xs text-white/50">
                    Aggregated visibility and sentiment analytics across all engines for this run.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Visibility Index */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <BarChart2 className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Visibility Index</h4>
                        <p className="mt-2 text-3xl font-bold text-white">{visibility}</p>
                    </div>
                    <p className="mt-3 text-[10px] text-white/40">
                        Average visibility weight across all model responses.
                    </p>
                </div>

                {/* Mention Rate */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                            <CheckSquare className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Mention Rate</h4>
                        <p className="mt-2 text-3xl font-bold text-white">{mentionRate}%</p>
                    </div>
                    <p className="mt-3 text-[10px] text-white/40">
                        Percentage of AI responses that directly cite your brand.
                    </p>
                </div>

                {/* Avg Prominence */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Star className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Avg Prominence</h4>
                        <p className="mt-2 text-3xl font-bold text-white">{prominence}</p>
                    </div>
                    <p className="mt-3 text-[10px] text-white/40">
                        How highly positioned your brand is in the answer narrative.
                    </p>
                </div>

                {/* Dominant Sentiment */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                            <MessageSquare className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Brand Sentiment</h4>
                        <p className="mt-2 text-3xl font-bold text-white">{getSentimentLabel(sentiment)}</p>
                    </div>
                    <p className="mt-3 text-[10px] text-white/40">
                        Contextual sentiment direction (Average: {sentiment}).
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center max-w-xl mx-auto space-y-2">
                <h4 className="text-sm font-semibold text-white">No historical trends in Demo Mode</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                    Demo Mode executes queries on-demand, which represents a single snapshot in time. In the main dashboard, tracking history generates graphs showing visibility gains, losses, and market share trends.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 hover:scale-[1.01]"
                >
                    Next: Alerts & Recommendations
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
