"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import QueryList from "@/components/queryPage/QueryList";
import KPIGrid from "@/components/queryPage/QueryStats";

type Query = {
    id: string;
    query_text: string;
    brand_name: string;
    brand_logo: string;
    frequency: string;
    brand_id: string;
    query_type: "brand" | "category" | "competitor";
    created_at: string;
    is_active: boolean;
    is_paused: boolean;
    responses: number;
    brand_mentions: number;
    visibility: number;
    prominence: number;
    sentiment: number;
    runs: number;
    last_run: string | null;
    runs_7d: number;
    failed_runs_7d: number;
    success_runs_7d: number;
    runs_24h: number;
    failed_runs_24h: number;
    source_breakdown?: Array<{
        source_type: string;
        responses: number;
        brand_mentions: number;
        visibility: number;
        prominence: number;
        sentiment: number;
        runs: number;
        last_run: string | null;
    }>;
};

export default function NewQueryPage() {
    const [brands, setBrands] = useState<any[]>([]);
    const [queries, setQueries] = useState<Query[]>([]);

    const [success, setSuccess] = useState<string | null>(null);
    const [queriesLoading, setQueriesLoading] = useState(false);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [filterBrandId, setFilterBrandId] = useState("");
    const [filterSourceType, setFilterSourceType] = useState("");
    const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get("/brands/for_dashboard")
            .then((res) => setBrands(res.data))
            .catch(() => setQueryError("Failed to load brands"));
    }, []);

    useEffect(() => {
        const fetchQueries = async () => {
            setQueriesLoading(true);
            setQueryError(null);

            try {
                const params = new URLSearchParams();
                if (filterBrandId) {
                    params.set("brand_id", filterBrandId);
                }
                if (filterSourceType) {
                    params.set("source_type", filterSourceType);
                }

                const res = await axios.get(`/queries${params.toString() ? `?${params.toString()}` : ""}`);
                setQueries(res.data?.queries ?? res.data);
            } catch {
                setQueryError("Failed to load queries");
            } finally {
                setQueriesLoading(false);
            }
        };

        fetchQueries();
    }, [filterBrandId, filterSourceType]);

    async function refreshQueries() {
        setQueriesLoading(true);
        setQueryError(null);

        try {
            const params = new URLSearchParams();
            if (filterBrandId) {
                params.set("brand_id", filterBrandId);
            }
            if (filterSourceType) {
                params.set("source_type", filterSourceType);
            }

            const res = await axios.get(`/queries${params.toString() ? `?${params.toString()}` : ""}`);
            setQueries(res.data?.queries ?? res.data);
        } catch {
            setQueryError("Failed to load queries");
        } finally {
            setQueriesLoading(false);
        }
    }

    async function runBulkAction(
        action: "run_once" | "delete" | "pause" | "activate" | "unschedule" | "resume",
        queryIds: string[]
    ) {
        if (queryIds.length === 0) return;

        const requiresConfirm = action === "delete" || action === "unschedule";
        if (requiresConfirm) {
            const ok = confirm(`Apply "${action}" to ${queryIds.length} selected queries?`);
            if (!ok) return;
        }

        setBulkActionLoading(action);

        const failed: string[] = [];
        let runLimitHit = false;

        for (const queryId of queryIds) {
            try {
                if (action === "run_once") {
                    await axios.post(`/queries/${queryId}/manual-run`, {});
                    continue;
                }

                if (action === "delete") {
                    await axios.delete(`/queries/${queryId}`);
                    continue;
                }

                if (action === "pause") {
                    await axios.post(`/queries/${queryId}/pause`, {});
                    continue;
                }

                if (action === "activate") {
                    await axios.post(`/queries/${queryId}/auto-schedule`, {});
                    continue;
                }

                if (action === "unschedule") {
                    await axios.post(`/queries/${queryId}/unschedule`, {});
                    continue;
                }

                if (action === "resume") {
                    await axios.post(`/queries/${queryId}/resume`, {});
                }
            } catch (err: any) {
                const code = err?.response?.data?.error;
                if (action === "run_once" && code === "run_limit_exceeded") {
                    runLimitHit = true;
                    break;
                }
                failed.push(queryId);
            }
        }

        await refreshQueries();
        setBulkActionLoading(null);

        if (runLimitHit) {
            alert("Run limit reached while running selected queries.");
            return;
        }

        if (failed.length > 0) {
            alert(`${failed.length} selected queries failed for action "${action}".`);
            return;
        }

        setSuccess(`Applied "${action}" to ${queryIds.length} queries.`);
        setTimeout(() => setSuccess(null), 2000);
    }

    return (
        <main className="pt-28 sm:pt-0 space-y-8">
            <KPIGrid brands={brands} queries={queries} onCreated={refreshQueries}/>
            <QueryList
                brands={brands}
                queries={queries}
                queriesLoading={queriesLoading}
                queryError={queryError}
                filterBrandId={filterBrandId}
                onFilterBrandChange={setFilterBrandId}
                filterSourceType={filterSourceType}
                onFilterSourceChange={setFilterSourceType}
                onBulkAction={runBulkAction}
                bulkActionLoading={bulkActionLoading}
            />
            {success && (
                <div className="border border-green-300 bg-green-50 px-3 py-1.5 text-xs text-green-700 rounded">
                    {success}
                </div>
            )}
        </main>
    );
}
