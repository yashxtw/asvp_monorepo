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

type MentionTrend = {
    day: string;
    mention_rate: string | number;
    mentions: string | number;
    total: string | number;
};

type MentionsResponse = {
    success: boolean;
    data: MentionTrend[];
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

export default function BrandMentionsDashboard({
    brandId,
    dateRange,
    source,
    onMentionsChange,
    onTotalResponsesChange,
    onMentionRateChange,
    onMentionRateTrendChange,
    onTotalResponsesTrendChange,
}: {
    brandId: string;
    dateRange: "7d" | "30d";
    source: string;
    onMentionsChange: (mentions: number) => void;
    onTotalResponsesChange: (total: number) => void;
    onMentionRateChange: (rate: number) => void;
    onMentionRateTrendChange: (trend: string | null) => void;
    onTotalResponsesTrendChange: (trend: string | null) => void;
}) {
    const [response, setResponse] = useState<MentionsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMentions() {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    brandId,
                    range: dateRange,
                });
                if (source) params.set("source", source);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE}/dashboard/brandMentions?${params.toString()}`,
                    {
                        credentials: "include"
                    }
                );

                const data = await res.json();
                setResponse(data);
            } catch (err) {
                console.error("Failed to fetch brand mentions:", err);
            } finally {
                setLoading(false);
            }
        }

        if (brandId) fetchMentions();
    }, [brandId, dateRange, source]);

    const metrics = useMemo(() => {
        const currentWindowDays = dateRange === "30d" ? 30 : 7;
        const now = Date.now();
        const currentWindowStart = now - currentWindowDays * 24 * 60 * 60 * 1000;
        const previousWindowStart = now - currentWindowDays * 2 * 24 * 60 * 60 * 1000;

        const normalized = (response?.data ?? []).map((row) => ({
            day: new Date(row.day).toLocaleDateString(),
            timestamp: new Date(row.day).getTime(),
            mention_rate: Number(row.mention_rate),
            mentions: Number(row.mentions),
            total: Number(row.total),
        }));

        const currentWindow = normalized.filter((row) => row.timestamp >= currentWindowStart);
        const previousWindow = normalized.filter(
            (row) => row.timestamp >= previousWindowStart && row.timestamp < currentWindowStart
        );

        const currentMentions = currentWindow.reduce((sum, row) => sum + row.mentions, 0);
        const currentTotal = currentWindow.reduce((sum, row) => sum + row.total, 0);
        const currentMentionRate = currentTotal ? (currentMentions / currentTotal) * 100 : 0;

        const previousMentions = previousWindow.reduce((sum, row) => sum + row.mentions, 0);
        const previousTotal = previousWindow.reduce((sum, row) => sum + row.total, 0);
        const previousMentionRate = previousTotal ? (previousMentions / previousTotal) * 100 : 0;

        return {
            currentMentions,
            currentTotal,
            currentMentionRate,
            mentionRateTrend: formatTrend(currentMentionRate, previousMentionRate, previousWindow.length > 0),
            totalResponsesTrend: formatTrend(currentTotal, previousTotal, previousWindow.length > 0),
            chartData: currentWindow.map((row) => ({
                day: row.day,
                mention_rate: row.mention_rate,
            })),
        };
    }, [dateRange, response?.data]);

    useEffect(() => {
        if (!response?.success) {
            return;
        }

        onMentionsChange(metrics.currentMentions);
        onTotalResponsesChange(metrics.currentTotal);
        onMentionRateChange(metrics.currentMentionRate);
        onMentionRateTrendChange(metrics.mentionRateTrend);
        onTotalResponsesTrendChange(metrics.totalResponsesTrend);
    }, [
        metrics.currentMentionRate,
        metrics.currentMentions,
        metrics.currentTotal,
        metrics.mentionRateTrend,
        metrics.totalResponsesTrend,
        onMentionRateChange,
        onMentionRateTrendChange,
        onMentionsChange,
        onTotalResponsesChange,
        onTotalResponsesTrendChange,
        response?.success,
    ]);

    if (loading) {
        return (
            <Card className="rounded-2xl shadow-sm col-span-8 border-zinc-300 animate-pulse">
                <CardHeader>
                    <div className="h-4 w-40 bg-zinc-200 rounded"></div>
                </CardHeader>

                <CardContent>
                    <div className="h-72 w-full flex items-end gap-2">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-zinc-200 rounded"
                                style={{ height: `${30 + Math.random() * 40}%` }}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!response?.data.length) {
        return <div className="text-sm text-muted-foreground border border-yellow-500 px-2 py-1 bg-yellow-100">No mention data available.</div>;
    }

    if (!response.success) {
        return <div className="text-sm text-red-500">Failed to load brand mentions.</div>;
    }

    return (
        <div className="">
            <Card className="rounded-2xl shadow-sm col-span-8 border-zinc-300">
                <CardHeader>
                    <CardTitle className="text-sm">Brand Mention Trend</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`} />
                                <Line
                                    type="monotone"
                                    dataKey="mention_rate"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
