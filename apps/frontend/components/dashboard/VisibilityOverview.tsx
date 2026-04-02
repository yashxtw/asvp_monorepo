"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/shadcn/card";
import { AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import axios from "axios";

type RunRow = {
  created_at: string;
  visibility_score: number;
  trust: number;
  sentiment: number;
  brandPresence: number;
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

export default function VisibilityOverview({
  brandId,
  dateRange,
  source,
  onAverageVisibilityChange,
  onVisibilityChange,
}: {
  brandId: string;
  dateRange: "7d" | "30d";
  source: string;
  onAverageVisibilityChange: (avg: number | null) => void;
  onVisibilityChange: (change: string | null) => void;
}) {
  const [data, setData] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          brandId,
          range: dateRange,
        });
        if (source) params.set("source", source);

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE}/dashboard/visibility-overview?${params.toString()}`,
          {
            withCredentials: true,
          }
        );
        setData(res.data?.data || []);
      } catch (error) {
        console.error("Error fetching visibility overview data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [brandId, dateRange, source]);

  const metrics = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const currentWindowDays = dateRange === "30d" ? 30 : 7;
    const now = Date.now();
    const currentWindowStart = now - currentWindowDays * 24 * 60 * 60 * 1000;
    const previousWindowStart = now - currentWindowDays * 2 * 24 * 60 * 60 * 1000;

    const currentWindow = sorted.filter((row) => {
      const ts = new Date(row.created_at).getTime();
      return ts >= currentWindowStart;
    });

    const previousWindow = sorted.filter((row) => {
      const ts = new Date(row.created_at).getTime();
      return ts >= previousWindowStart && ts < currentWindowStart;
    });

    const current = sorted[sorted.length - 1]?.visibility_score ?? 0;
    const avgCurrent =
      currentWindow.reduce((acc, cur) => acc + (cur.visibility_score || 0), 0) / (currentWindow.length || 1);
    const prevAvg =
      previousWindow.reduce((acc, cur) => acc + (cur.visibility_score || 0), 0) / (previousWindow.length || 1);
    const last10 = currentWindow.slice(-10);
    const firstOfLast10 = last10[0]?.visibility_score ?? 0;
    const lastOfLast10 = last10[last10.length - 1]?.visibility_score ?? 0;
    const dropPercent = firstOfLast10 ? ((firstOfLast10 - lastOfLast10) / firstOfLast10) * 100 : 0;

    return {
      current,
      avgCurrent,
      trend: formatTrend(avgCurrent, prevAvg, previousWindow.length > 0),
      dropPercent,
      formatData: currentWindow.map((row, index) => ({
        index: index + 1,
        visibility: row.visibility_score,
        trust: row.trust,
        sentiment: row.sentiment,
        brandPresence: row.brandPresence,
      })),
    };
  }, [data, dateRange]);

  useEffect(() => {
    onAverageVisibilityChange(
      Number.isFinite(metrics.avgCurrent) ? parseFloat(metrics.avgCurrent.toFixed(2)) : null
    );
    onVisibilityChange(metrics.trend);
  }, [metrics.avgCurrent, metrics.trend, onAverageVisibilityChange, onVisibilityChange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch animate-pulse">
        <Card className="h-full flex flex-col rounded-2xl shadow-sm border-zinc-300">
          <CardHeader>
            <div className="h-4 w-40 bg-zinc-200 rounded"></div>
          </CardHeader>

          <CardContent className="flex flex-col justify-between flex-1 space-y-6">
            <div className="h-40 w-full bg-zinc-200 rounded-lg"></div>

            <div className="grid grid-cols-3 gap-6 text-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 mx-auto bg-zinc-200 rounded"></div>
                  <div className="h-6 w-12 mx-auto bg-zinc-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col rounded-2xl shadow-sm border-zinc-300">
          <CardHeader>
            <div className="h-4 w-32 bg-zinc-200 rounded"></div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 justify-between space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-4 items-center gap-2">
                <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                <div className="col-span-3 h-16 bg-zinc-200 rounded-lg"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-sm text-muted-foreground border border-yellow-500 px-2 py-1 bg-yellow-100">No visibility runs available yet.</div>
    );
  }

  const change = metrics.trend ? Number(metrics.trend.replace("%", "")) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
      <Card className="h-full flex flex-col rounded-2xl shadow-sm border-zinc-300">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            AI Visibility Overview ({dateRange === "30d" ? "Last 30 Days" : "Last 7 Days"})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between flex-1 space-y-6">
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.formatData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="visibility" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-2xl font-bold">{metrics.current.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dateRange === "30d" ? "30d Avg" : "7d Avg"}</p>
              <p className="text-2xl font-bold">{metrics.avgCurrent.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Change</p>
              <p
                className={`text-2xl font-bold ${change === null ? "text-gray-500" : change >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {change === null ? "N/A" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col rounded-2xl shadow-sm border-zinc-300">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Metric Stability</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-between space-y-1">
          {[
            { key: "trust", label: "Trust" },
            { key: "sentiment", label: "Sentiment" },
            { key: "brandPresence", label: "Brand Presence" },
          ].map((metric) => (
            <div key={metric.key} className="grid grid-cols-4 items-center gap-1">
              <p className="text-sm font-medium col-span-1">{metric.label}</p>
              <div className="col-span-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.formatData}>
                    <Area
                      type="monotone"
                      dataKey={metric.key}
                      strokeWidth={2}
                      fillOpacity={0.1}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* {metrics.dropPercent > 10 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-2xl border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-700">
                Visibility dropped {metrics.dropPercent.toFixed(0)}% in last 10 runs.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )} */}
    </div>
  );
}
