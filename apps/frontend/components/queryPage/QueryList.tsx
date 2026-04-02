"use client";

import { useEffect, useMemo, useState } from "react";
import Loading from "@/components/Loading";
import Image from "next/image";

type Brand = {
    id: string;
    brand_name: string;
    brand_logo: string;
};

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

type Props = {
    brands: Brand[];
    queries: Query[];
    queriesLoading: boolean;
    queryError: string | null;
    filterBrandId: string;
    onFilterBrandChange: (brandId: string) => void;
    filterSourceType: string;
    onFilterSourceChange: (sourceType: string) => void;
    onBulkAction: (
        action: "run_once" | "delete" | "pause" | "activate" | "unschedule" | "resume",
        queryIds: string[]
    ) => void | Promise<void>;
    bulkActionLoading: string | null;
};

export default function QueryList({
    brands,
    queries,
    queriesLoading,
    queryError,
    filterBrandId,
    onFilterBrandChange,
    filterSourceType,
    onFilterSourceChange,
    onBulkAction,
    bulkActionLoading,
}: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => queries.some((q) => q.id === id)));
    }, [queries]);

    const allSelected = useMemo(() => {
        return queries.length > 0 && selectedIds.length === queries.length;
    }, [queries, selectedIds]);

    const isAnyBulkRunning = Boolean(bulkActionLoading);

    function toggleSelectAll() {
        if (allSelected) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(queries.map((q) => q.id));
    }

    function toggleSelectOne(queryId: string) {
        setSelectedIds((prev) =>
            prev.includes(queryId)
                ? prev.filter((id) => id !== queryId)
                : [...prev, queryId]
        );
    }

    async function executeBulkAction(
        action: "run_once" | "delete" | "pause" | "activate" | "unschedule" | "resume"
    ) {
        if (selectedIds.length === 0 || isAnyBulkRunning) return;
        await onBulkAction(action, selectedIds);
        if (action === "delete") {
            setSelectedIds([]);
        }
    }

    return (
        <section className="w-full">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold italic pb-2">Queries.</h2>
                    {queriesLoading && <Loading />}
                </div>

                <div className="flex items-center gap-2 pb-2">
                    <select
                        value={filterBrandId}
                        onChange={(e) => onFilterBrandChange(e.target.value)}
                        className="px-3 py-2 text-sm"
                    >
                        <option value="">All brands</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.brand_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterSourceType}
                        onChange={(e) => onFilterSourceChange(e.target.value)}
                        className="px-3 py-2 text-sm"
                    >
                        <option value="">All sources</option>
                        <option value="google_aio">Google AIO</option>
                        <option value="gemini">Gemini</option>
                        <option value="chatgpt">ChatGPT</option>
                        <option value="claude">Claude</option>
                    </select>
                </div>
            </div>

            <div className="">

                {queries.length > 0 && (
                    <div className="mb-3 rounded-lg shadow-sm bg-white border border-gray-300 px-3 py-2 text-xs flex flex-wrap items-center gap-2">
                        <span className="font-medium">{selectedIds.length} selected</span>
                        <button
                            onClick={() => executeBulkAction("run_once")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                        >
                            {bulkActionLoading === "run_once" ? "Running..." : "Run once"}
                        </button>
                        <button
                            onClick={() => executeBulkAction("pause")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                        >
                            {bulkActionLoading === "pause" ? "Pausing..." : "Pause"}
                        </button>
                        <button
                            onClick={() => executeBulkAction("resume")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                            {bulkActionLoading === "resume" ? "Resuming..." : "Resume"}
                        </button>
                        <button
                            onClick={() => executeBulkAction("activate")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-zinc-300 text-black hover:bg-black hover:text-white disabled:opacity-50"
                        >
                            {bulkActionLoading === "activate" ? "Activating..." : "Activate"}
                        </button>
                        <button
                            onClick={() => executeBulkAction("unschedule")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                            {bulkActionLoading === "unschedule" ? "Stopping..." : "Unschedule"}
                        </button>
                        <button
                            onClick={() => executeBulkAction("delete")}
                            disabled={isAnyBulkRunning}
                            className="px-2 py-1 rounded-lg shadow-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                            {bulkActionLoading === "delete" ? "Deleting..." : "Delete"}
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            disabled={isAnyBulkRunning}
                            className="ml-auto px-2 py-1 rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {queries.length > 0 && (
                    <div className="mb-3 text-xs text-gray-600 flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4"
                        />
                        <span className="italic">Select all queries on this page</span>
                    </div>
                )}

                {!queriesLoading && queries.length === 0 && (
                    <p className="text-sm text-gray-500">No queries found, Add your first query to see how your brand appears in GPT, Gemini & Claude.</p>
                )}
                {queryError && (
                    <p className="text-sm text-red-500">
                        Error loading queries: {queryError}
                    </p>
                )}

                {queries.map((q) => (
                    <div
                        key={q.id}
                        className="py-1 text-sm flex items-start justify-between gap-4"
                    >
                        <div className="bg-white border-t border-zinc-300 shadow-sm w-full p-3 rounded-lg">
                            <div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(q.id)}
                                        onChange={() => toggleSelectOne(q.id)}
                                        aria-label={`Select query ${q.query_text}`}
                                        className="h-4 w-4"
                                    />
                                    <span className="font-medium">{q.query_text}</span>

                                    {q.is_active && !q.is_paused && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    )}

                                    {q.is_active && q.is_paused && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                            Paused
                                        </span>
                                    )}

                                    {!q.is_active && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Image
                                        src={q.brand_logo}
                                        alt={q.brand_name}
                                        width={24}
                                        height={24}
                                        className="w-4 h-4 rounded-sm border border-black"
                                    />

                                    <span>
                                        {q.brand_name} | {q.frequency} | {q.query_type}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                                    <span>Responses: {q.responses}</span>
                                    <span>Mentions: {q.brand_mentions}</span>
                                    <span>Visibility: {q.visibility}%</span>
                                    <span>Prominence: {q.prominence}</span>
                                    <span>Sentiment: {q.sentiment}</span>
                                    <span>Runs: {q.runs}</span>

                                    <span>
                                        Last run:{" "}
                                        {q.last_run
                                            ? new Date(q.last_run).toLocaleString()
                                            : "Never"}
                                    </span>
                                </div>

                                {q.source_breakdown && q.source_breakdown.length > 0 && (
                                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                        {q.source_breakdown.map((source) => (
                                            <div
                                                key={`${q.id}-${source.source_type}`}
                                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-gray-700"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium capitalize">
                                                        {source.source_type.replace("_", " ")}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        {source.runs} runs
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                                                    <span>Resp: {source.responses}</span>
                                                    <span>Mentions: {source.brand_mentions}</span>
                                                    <span>Vis: {source.visibility}</span>
                                                    <span>Prom: {source.prominence}</span>
                                                    <span>Sent: {source.sentiment}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
