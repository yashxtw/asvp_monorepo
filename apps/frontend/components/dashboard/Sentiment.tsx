"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/shadcn/card";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from "recharts";

type SentimentRow = {
    created_at: string;
    sentiment_score: number;
    sentiment_label: "positive" | "neutral" | "negative";
    positive_sim: number;
    neutral_sim: number;
    negative_sim: number;
};

type ApiResponse = {
    success: boolean;
    data: SentimentRow[];
};

function formatTrend(current: number, previous: number, hasBaseline: boolean) {
    if (!hasBaseline) {
        return null;
    }

    if (previous === 0) {
        return current === 0 ? "0.00%" : null;
    }

    const change = ((current - previous) / Math.abs(previous)) * 100;
    return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
}

export default function SentimentDashboard({
    brandId,
    dateRange,
    source,
    onDominantSentimentChange,
    onSentimentTrendChange,
}: {
    brandId: string;
    dateRange: "7d" | "30d";
    source: string;
    onDominantSentimentChange: (label: "positive" | "neutral" | "negative" | null) => void;
    onSentimentTrendChange: (trend: string | null) => void;
}) {
    const [data, setData] = useState<SentimentRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSentiment() {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    brandId,
                    range: dateRange,
                });
                if (source) params.set("source", source);

                const res = await fetch(`/api/backend/dashboard/sentiment-overview?${params.toString()}`, {
                    credentials: "include",
                });

                const json: ApiResponse = await res.json();

                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error("Sentiment fetch failed", err);
            } finally {
                setLoading(false);
            }
        }

        if (brandId) {
            fetchSentiment();
        } else {
            onDominantSentimentChange(null);
            onSentimentTrendChange(null);
        }
    }, [brandId, dateRange, source, onDominantSentimentChange, onSentimentTrendChange]);

    const metrics = useMemo(() => {
        const currentWindowDays = dateRange === "30d" ? 30 : 7;
        const now = Date.now();
        const currentWindowStart = now - currentWindowDays * 24 * 60 * 60 * 1000;
        const previousWindowStart = now - currentWindowDays * 2 * 24 * 60 * 60 * 1000;

        const currentWindow = data.filter((row) => {
            const ts = new Date(row.created_at).getTime();
            return ts >= currentWindowStart;
        });

        const previousWindow = data.filter((row) => {
            const ts = new Date(row.created_at).getTime();
            return ts >= previousWindowStart && ts < currentWindowStart;
        });

        const currentAverage =
            currentWindow.reduce((sum, row) => sum + row.sentiment_score, 0) /
            (currentWindow.length || 1);
        const previousAverage =
            previousWindow.reduce((sum, row) => sum + row.sentiment_score, 0) /
            (previousWindow.length || 1);

        const labelCounts = currentWindow.reduce(
            (acc, row) => {
                acc[row.sentiment_label] += 1;
                return acc;
            },
            { positive: 0, neutral: 0, negative: 0 }
        );

        const dominantLabel = (Object.entries(labelCounts).sort(
            (a, b) => b[1] - a[1]
        )[0]?.[0] || null) as "positive" | "neutral" | "negative" | null;

        const chartData = [...data]
            .filter((row) => new Date(row.created_at).getTime() >= currentWindowStart)
            .reverse()
            .map((row) => ({
                time: new Date(row.created_at).toLocaleTimeString(),
                sentiment: row.sentiment_score,
                positive: row.positive_sim,
                neutral: row.neutral_sim,
                negative: row.negative_sim
            }));

        return {
            dominantLabel,
            trend: formatTrend(currentAverage, previousAverage, previousWindow.length > 0),
            chartData,
        };
    }, [data, dateRange]);

    useEffect(() => {
        onSentimentTrendChange(metrics.trend);
        onDominantSentimentChange(metrics.dominantLabel);
    }, [metrics.dominantLabel, metrics.trend, onDominantSentimentChange, onSentimentTrendChange]);

    if (loading) {
        return (
            <Card className="rounded-2xl shadow-sm border-zinc-300 animate-pulse">
                <CardHeader>
                    <div className="h-4 w-48 bg-zinc-200 rounded"></div>
                </CardHeader>

                <CardContent>
                    <div className="h-72 w-full flex items-end gap-2">
                        {[...Array(16)].map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-zinc-200 rounded"
                                style={{ height: `${25 + Math.random() * 50}%` }}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data.length) {
        return <div className="text-sm text-muted-foreground border border-yellow-500 px-2 py-1 bg-yellow-100">No sentiment data.</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-zinc-300">
                <CardHeader>
                    <CardTitle className="text-sm">
                        Sentiment Trend ({dateRange === "30d" ? "Last 30 Days" : "Last 7 Days"})
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis domain={[0, 1]} />
                                <Tooltip formatter={(value: number | undefined) => `${(value ?? 0).toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="neutral" stroke="#64748b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
