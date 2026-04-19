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
    CartesianGrid
} from "recharts";

type ProminenceRow = {
    created_at: string;
    prominence_score: number;
    first_sentence_index: number;
    best_sentence: string;
};

type ApiResponse = {
    success: boolean;
    data: ProminenceRow[];
};

type ChartPoint = {
    time: string;
    score: number;
    first_sentence_index: number;
    best_sentence: string;
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

export default function ProminenceDashboard({
    brandId,
    dateRange,
    source,
    onAverageProminence,
    onAveragePosition,
    onProminenceTrendChange,
}: {
    brandId: string;
    dateRange: "7d" | "30d";
    source: string;
    onAverageProminence: (avg: number | null) => void;
    onAveragePosition: (avg: string | null) => void;
    onProminenceTrendChange: (trend: string | null) => void;
}) {
    const [data, setData] = useState<ProminenceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

    useEffect(() => {
        async function fetchProminence() {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    brandId,
                    range: dateRange,
                });
                if (source) params.set("source", source);

                const res = await fetch(`/api/backend/dashboard/prominenceTrend?${params.toString()}`, {
                    credentials: "include",
                });

                const json: ApiResponse = await res.json();

                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error("Prominence fetch failed", err);
            } finally {
                setLoading(false);
            }
        }

        if (brandId) fetchProminence();
    }, [brandId, dateRange, source]);

    const metrics = useMemo(() => {
        const currentWindowDays = dateRange === "30d" ? 30 : 7;
        const now = Date.now();
        const currentWindowStart = now - currentWindowDays * 24 * 60 * 60 * 1000;
        const previousWindowStart = now - currentWindowDays * 2 * 24 * 60 * 60 * 1000;

        const currentMentions = data.filter(
            (row) => row.prominence_score > 0 && new Date(row.created_at).getTime() >= currentWindowStart
        );
        const previousMentions = data.filter((row) => {
            const ts = new Date(row.created_at).getTime();
            return row.prominence_score > 0 && ts >= previousWindowStart && ts < currentWindowStart;
        });

        const avgScore =
            currentMentions.reduce((sum, row) => sum + row.prominence_score, 0) /
            (currentMentions.length || 1);
        const previousAvgScore =
            previousMentions.reduce((sum, row) => sum + row.prominence_score, 0) /
            (previousMentions.length || 1);
        const avgPosition =
            currentMentions.reduce((sum, row) => sum + row.first_sentence_index, 0) /
            (currentMentions.length || 1);

        return {
            avgScore,
            avgPosition,
            trend: formatTrend(avgScore, previousAvgScore, previousMentions.length > 0),
            chartData: [...data]
                .filter((row) => new Date(row.created_at).getTime() >= currentWindowStart)
                .reverse()
                .map((row) => ({
                    time: new Date(row.created_at).toLocaleTimeString(),
                    score: row.prominence_score,
                    first_sentence_index: row.first_sentence_index,
                    best_sentence: row.best_sentence
                })),
        };
    }, [data, dateRange]);

    useEffect(() => {
        onAverageProminence(Number.isFinite(metrics.avgScore) ? parseFloat(metrics.avgScore.toFixed(2)) : null);
        onAveragePosition(metrics.avgPosition >= 0 ? `${Math.round(metrics.avgPosition)}` : null);
        onProminenceTrendChange(metrics.trend);
    }, [
        metrics.avgPosition,
        metrics.avgScore,
        metrics.trend,
        onAveragePosition,
        onAverageProminence,
        onProminenceTrendChange,
    ]);

    useEffect(() => {
        if (metrics.chartData.length > 0) {
            setActivePoint(metrics.chartData[metrics.chartData.length - 1]);
        } else {
            setActivePoint(null);
        }
    }, [metrics.chartData]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <Card className="rounded-2xl shadow-sm border-zinc-300">
                    <CardHeader>
                        <div className="h-4 w-52 bg-zinc-200 rounded"></div>
                    </CardHeader>

                    <CardContent>
                        <div className="h-80 w-full bg-zinc-200 rounded-lg"></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="h-4 w-40 bg-zinc-200 rounded"></div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        <div className="h-3 w-full bg-zinc-200 rounded"></div>
                        <div className="h-3 w-11/12 bg-zinc-200 rounded"></div>
                        <div className="h-3 w-10/12 bg-zinc-200 rounded"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data.length) {
        return <div className="text-sm text-muted-foreground border border-yellow-500 px-2 py-1 bg-yellow-100">No prominence data available yet.</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-zinc-300">
                <CardHeader>
                    <CardTitle className="text-sm">
                        Prominence Trend ({dateRange === "30d" ? "Last 30 Days" : "Last 7 Days"})
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={metrics.chartData}
                                onMouseMove={(state: any) => {
                                    if (state && state.activePayload && state.activePayload.length) {
                                        setActivePoint(state.activePayload[0].payload);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (metrics.chartData.length) {
                                        setActivePoint(metrics.chartData[metrics.chartData.length - 1]);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis domain={[0, 1]} />
                                <Tooltip
                                    formatter={(value: number | undefined) => `${(value ?? 0).toFixed(2)}`}
                                    labelFormatter={(label, payload) => {
                                        const row: any = payload?.[0]?.payload;
                                        if (!row) return label;
                                        return `Time: ${label} | Sentence: ${row.first_sentence_index}`;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {activePoint?.best_sentence && (
                <Card className="rounded-2xl shadow-sm border-zinc-300">
                    <CardHeader>
                        <CardTitle className="text-sm">Strongest Brand Mention</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground ">
                            {activePoint.best_sentence}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
