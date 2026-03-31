"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Loading from "@/components/Loading";

type AlertRow = {
    id: string;
    alert_type: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "acknowledged" | "resolved";
    title: string | null;
    message: string;
    brand_id: string | null;
    brand_name: string | null;
    query_text: string | null;
    query_type: string | null;
    source_type: string | null;
    metric_value: number | null;
    baseline_value: number | null;
    threshold_value: number | null;
    evidence: Record<string, unknown> | null;
    recommendation_hint: string;
    first_seen_at: string;
    last_seen_at: string;
};

type BrandOption = {
    id: string;
    brand_name: string;
};

type AlertSummary = {
    total: number;
    unresolved: number;
    high_priority: number;
    brands_impacted: number;
    by_status: Record<string, number>;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
};

type KPI = {
    title: string;
    value: number | string;
};

const severityStyles: Record<string, string> = {
    low: "bg-zinc-100 text-zinc-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-700",
};

const statusStyles: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    acknowledged: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
};

const alertTypeLabels: Record<string, string> = {
    visibility_drop: "Visibility Drop",
    mention_rate_drop: "Mention Rate Drop",
    negative_sentiment_spike: "Negative Sentiment Spike",
    prominence_drop: "Prominence Drop",
    brand_missing: "Brand Missing",
    connector_failure: "Connector Failure",
};

function formatMetric(value: number | null) {
    if (value === null || Number.isNaN(value)) return "N/A";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDelta(metricValue: number | null, baselineValue: number | null) {
    if (metricValue === null || baselineValue === null) {
        return "N/A";
    }
    if (baselineValue === 0) {
        return metricValue === 0 ? "0.00%" : "N/A";
    }
    const delta = ((metricValue - baselineValue) / Math.abs(baselineValue)) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
}

function getAlertMeta(alert: AlertRow) {
    const impactArea = String(alert.evidence?.impact_area ?? "analysis");
    const nextActionHint = String(alert.evidence?.next_action_hint ?? alert.recommendation_hint);

    return {
        label: alertTypeLabels[alert.alert_type] ?? alert.alert_type,
        impactArea,
        nextActionHint,
    };
}

function KPICard({ title, value }: KPI) {
    return (
        <div className="bg-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
            <p className="text-xs font-medium text-zinc-800">{title}</p>
            <div className="mt-3 items-end justify-between">
                <h2 className="text-3xl font-semibold text-gray-900">{value}</h2>
            </div>
        </div>
    );
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertRow[]>([]);
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [summary, setSummary] = useState<AlertSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    async function loadAlerts() {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            if (severityFilter) params.set("severity", severityFilter);
            if (typeFilter) params.set("type", typeFilter);
            if (brandFilter) params.set("brand_id", brandFilter);
            if (sourceFilter) params.set("source", sourceFilter);

            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE}/alerts?${params.toString()}`,
                { withCredentials: true }
            );
            setAlerts(res.data?.data ?? []);
            setSummary(res.data?.summary ?? null);
        } catch {
            setError("Failed to load alerts");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        axios
            .get(`${process.env.NEXT_PUBLIC_API_BASE}/brands`, {
                withCredentials: true,
            })
            .then((res) => {
                const rawBrands = Array.isArray(res.data) ? res.data : res.data?.brands ?? [];
                setBrands(rawBrands);
            })
            .catch(() => {
                setBrands([]);
            });
    }, []);

    useEffect(() => {
        loadAlerts();
    }, [statusFilter, severityFilter, typeFilter, brandFilter, sourceFilter]);

    async function updateAlert(alertId: string, action: "ack" | "resolve") {
        try {
            setActionLoadingId(`${alertId}:${action}`);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE}/alerts/${alertId}/${action}`,
                {},
                { withCredentials: true }
            );
            await loadAlerts();
        } catch {
            setError(`Failed to ${action} alert`);
        } finally {
            setActionLoadingId(null);
        }
    }

    async function runAlertGeneration() {
        try {
            setRefreshing(true);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE}/alerts/run`,
                {},
                { withCredentials: true }
            );
            setTimeout(() => {
                loadAlerts();
                setRefreshing(false);
            }, 1500);
        } catch {
            setRefreshing(false);
            setError("Failed to start alert generation");
        }
    }

    const kpis = useMemo(() => {
        if (!summary) return [] as KPI[];

        const topTypeEntry = Object.entries(summary.by_type).sort((a, b) => b[1] - a[1])[0];

        return [
            { title: "Total Alerts", value: summary.total },
            { title: "Unresolved", value: summary.unresolved },
            { title: "High Priority", value: summary.high_priority },
            { title: "Brands Impacted", value: summary.brands_impacted },
            {
                title: "Top Alert Type",
                value: topTypeEntry ? `${alertTypeLabels[topTypeEntry[0]] ?? topTypeEntry[0]} (${topTypeEntry[1]})` : "None",
            },
        ];
    }, [summary]);

    return (
        <main className="pt-28 sm:pt-0 space-y-8">
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    {kpis.map((kpi, index) => (
                        <KPICard key={index} {...kpi} />
                    ))}
                </div>
            )}

            <section className="w-full">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold italic pb-2">Alerts.</h2>
                        {loading && <Loading />}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="text-sm">
                            <option value="">All brands</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.brand_name}
                                </option>
                            ))}
                        </select>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm">
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="resolved">Resolved</option>
                        </select>

                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="text-sm">
                            <option value="">All severities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>

                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-sm">
                            <option value="">All alert types</option>
                            {Object.entries(alertTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>

                        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="text-sm">
                            <option value="">All sources</option>
                            <option value="chatgpt">ChatGPT</option>
                            <option value="gemini">Gemini</option>
                            <option value="perplexity">Perplexity</option>
                            <option value="google_aio">Google AIO</option>
                        </select>

                        <button
                            onClick={runAlertGeneration}
                            disabled={refreshing}
                            className="px-3 py-1.5 rounded-lg shadow-md border border-zinc-300 text-black hover:bg-black hover:text-white disabled:opacity-50 text-sm"
                        >
                            {refreshing ? "Generating..." : "Run Alert Scan"}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {!loading && alerts.length === 0 && !error && (
                    <p className="text-sm text-gray-500">No alerts found for the current filters.</p>
                )}

                <div>
                    {alerts.map((alert) => {
                        const meta = getAlertMeta(alert);
                        const delta = formatDelta(alert.metric_value, alert.baseline_value);

                        return (
                            <div key={alert.id} className="py-1 text-sm flex items-start justify-between gap-4">
                                <div className="bg-gray-100 w-full p-3 rounded-lg space-y-3">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">{alert.title || "Alert"}</span>

                                                <span className={`text-xs px-2 py-0.5 rounded-full ${severityStyles[alert.severity] || severityStyles.low}`}>
                                                    {alert.severity}
                                                </span>

                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[alert.status] || statusStyles.open}`}>
                                                    {alert.status}
                                                </span>

                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                    {meta.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                                                <span>Brand: {alert.brand_name || "Unknown"}</span>
                                                <span>Source: {alert.source_type || "Unknown"}</span>
                                                <span>Type: {alert.query_type || "N/A"}</span>
                                                <span>Impact: {meta.impactArea}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {alert.status === "open" && (
                                                <button
                                                    onClick={() => updateAlert(alert.id, "ack")}
                                                    disabled={actionLoadingId === `${alert.id}:ack`}
                                                    className="px-2 py-1 rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-xs"
                                                >
                                                    {actionLoadingId === `${alert.id}:ack` ? "Acknowledging..." : "Acknowledge"}
                                                </button>
                                            )}
                                            {alert.status !== "resolved" && (
                                                <button
                                                    onClick={() => updateAlert(alert.id, "resolve")}
                                                    disabled={actionLoadingId === `${alert.id}:resolve`}
                                                    className="px-2 py-1 rounded-lg shadow-md border border-black bg-black text-white hover:opacity-90 disabled:opacity-50 text-xs"
                                                >
                                                    {actionLoadingId === `${alert.id}:resolve` ? "Resolving..." : "Resolve"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700">{alert.message}</p>

                                    <div className="text-xs text-gray-500">
                                        Query: {alert.query_text || "N/A"}
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                                        <span>Current: {formatMetric(alert.metric_value)}</span>
                                        <span>Baseline: {formatMetric(alert.baseline_value)}</span>
                                        <span>Threshold: {formatMetric(alert.threshold_value)}</span>
                                        <span>Delta: {delta}</span>
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-blue-900">
                                        Recommendation context: {meta.nextActionHint}
                                    </div>

                                    <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                                        <span>First seen: {new Date(alert.first_seen_at).toLocaleString("en-IN")}</span>
                                        <span>Last seen: {new Date(alert.last_seen_at).toLocaleString("en-IN")}</span>
                                    </div>

                                    {alert.evidence && Object.keys(alert.evidence).length > 0 && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-700">Evidence</summary>
                                            <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-white p-3 text-gray-600 border border-gray-200">
                                                {JSON.stringify(alert.evidence, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
