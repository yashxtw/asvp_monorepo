"use client";

import { useState } from "react";
import Loading from "../Loading";
import { ArrowRight, Pencil, Info, Trash, Play, Power, Pause, RotateCcw, StopCircle } from "lucide-react";
import DescriptionModal from "./DescriptionModal";

type Brand = {
    id: string;
    brand_name: string;
    canonical_urls: string[];
    description: string;
    logo_url: string;
    competitors: string[];
    total_queries: number;
    active_queries: number;
    last_run_time: string | null;
    avg_visibility: number | null;
    avg_sentiment: number | null;
    mention_rate: number | null;
};

type Props = {
    brands: Brand[];
    fetchError: string | null;
    brandsLoading: boolean;
    deletingId?: string | null;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    actionLoadingKey?: string | null;
    onRunAllQueriesOnce?: (brandId: string) => void;
    onActivateAllQueries?: (brandId: string) => void;
    onPauseAllQueries?: (brandId: string) => void;
    onResumeAllQueries?: (brandId: string) => void;
    onUnscheduleAllQueries?: (brandId: string) => void;
};

export default function BrandList({
    brands,
    fetchError,
    brandsLoading,
    deletingId,
    onDelete,
    onEdit,
    actionLoadingKey,
    onRunAllQueriesOnce,
    onActivateAllQueries,
    onPauseAllQueries,
    onResumeAllQueries,
    onUnscheduleAllQueries,
}: Props) {

    const [selectedBrand, setSelectedBrand] = useState<any>(null);

    function formatMetric(value: number | null | undefined, digits = 2) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return null;
        }

        return value.toFixed(digits);
    }

    return (
        <section className="space-y-4 w-full">
            <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold italic">Your Brands.</h2>
                {brandsLoading && <Loading />}
            </div>

            <div className="">

                {/* Empty State */}
                {brands.length === 0 && !fetchError && !brandsLoading && (
                    <p className="text-sm text-gray-500">
                        No brands found. Add your first brand to start tracking AI visibility.
                    </p>
                )}

                {/* Error State */}
                {fetchError && (
                    <p className="text-sm text-red-500">
                        Error : {fetchError}
                    </p>
                )}

                {/* Brand List */}
                {brands.map((brand) => (
                    <div
                        key={brand.id}
                        className="text-sm flex py-1 items-start justify-between"
                    >
                        <div className="flex items-center gap-2 justify-between bg-white border-t border-zinc-300 shadow-sm rounded-lg p-3 w-full">
                            {/* Left Section */}
                            <div className="">
                                <div className="flex items-center gap-3">
                                    {brand.logo_url ? (
                                        <img
                                            src={brand.logo_url}
                                            alt={brand.brand_name}
                                            className="w-8 h-8 rounded object-cover border"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                                            {(brand.brand_name || "?")[0]}
                                        </div>

                                    )}

                                    <span className="font-medium flex items-center gap-2">
                                        {brand.brand_name || "Unnamed Brand"}

                                        {brand.description && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedBrand(brand)}
                                                    className=" rounded hover:bg-gray-100 text-blue-600"
                                                >
                                                    <Info size={14} />
                                                </button>
                                            </>
                                        )}

                                        <button className="cursor-pointer">
                                            <ArrowRight size={16} />
                                        </button>
                                    </span>

                                    {selectedBrand && (
                                        <DescriptionModal
                                            description={selectedBrand.description}
                                            onClose={() => setSelectedBrand(null)}
                                        />
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 mt-1 space-x-2">
                                    <span>
                                        {(brand.canonical_urls ?? []).length} URL
                                        {(brand.canonical_urls ?? []).length !== 1 && "s"}
                                    </span>

                                    {brand.competitors?.length > 0 && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {brand.competitors.length} competitor
                                                {brand.competitors.length !== 1 && "s"}
                                            </span>
                                        </>
                                    )}

                                    {brand.total_queries > 0 && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {brand.total_queries} total query
                                                {brand.total_queries !== 1 && "ies"}
                                            </span>
                                        </>
                                    )}

                                    {brand.active_queries > 0 && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {brand.active_queries} active query
                                                {brand.active_queries !== 1 && "ies"}
                                            </span>
                                        </>
                                    )}

                                    {formatMetric(brand.avg_visibility) !== null && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {formatMetric(brand.avg_visibility)}% visibility
                                            </span>
                                        </>
                                    )}

                                    {formatMetric(brand.avg_sentiment) !== null && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {formatMetric(brand.avg_sentiment)} average sentiment
                                            </span>
                                        </>
                                    )}

                                    {formatMetric(brand.mention_rate) !== null && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                {formatMetric(brand.mention_rate)}% mention rate
                                            </span>
                                        </>
                                    )}

                                    {brand.last_run_time && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                Last run: {new Date(brand.last_run_time).toLocaleString("en-IN", {
                                                    weekday: "short",
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-end justify-end gap-2 flex-wrap">

                                <button
                                    onClick={() => onRunAllQueriesOnce?.(brand.id)}
                                    disabled={actionLoadingKey === `${brand.id}:run_once`}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition disabled:opacity-50">
                                    <Play size={14} />
                                    {actionLoadingKey === `${brand.id}:run_once` ? "Running..." : "Run all once"}
                                </button>

                                <button
                                    onClick={() => onActivateAllQueries?.(brand.id)}
                                    disabled={actionLoadingKey === `${brand.id}:activate`}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition disabled:opacity-50">
                                    <Power size={14} />
                                    {actionLoadingKey === `${brand.id}:activate` ? "Activating..." : "Activate all"}
                                </button>

                                <button
                                    onClick={() => onPauseAllQueries?.(brand.id)}
                                    disabled={actionLoadingKey === `${brand.id}:pause`}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition disabled:opacity-50">
                                    <Pause size={14} />
                                    {actionLoadingKey === `${brand.id}:pause` ? "Pausing..." : "Pause all"}
                                </button>

                                <button
                                    onClick={() => onResumeAllQueries?.(brand.id)}
                                    disabled={actionLoadingKey === `${brand.id}:resume`}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition disabled:opacity-50">
                                    <RotateCcw size={14} />
                                    {actionLoadingKey === `${brand.id}:resume` ? "Resuming..." : "Resume all"}
                                </button>

                                <button
                                    onClick={() => onUnscheduleAllQueries?.(brand.id)}
                                    disabled={actionLoadingKey === `${brand.id}:unschedule`}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition disabled:opacity-50">
                                    <StopCircle size={14} />
                                    {actionLoadingKey === `${brand.id}:unschedule` ? "Stopping..." : "Unschedule all"}
                                </button>
                                
                                <button
                                    onClick={() => onEdit?.(brand.id)} 
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 rounded-md transition">
                                    <Pencil size={14} />
                                    Edit
                                </button>

                                <button
                                    onClick={() => onDelete?.(brand.id)}
                                    disabled={deletingId === brand.id}
                                    className="text-xs flex items-center gap-1 px-2 py-1 font-medium text-red-500 hover:text-red-700 cursor-pointer transition disabled:opacity-50"
                                >
                                    <Trash size={14} />
                                    {deletingId === brand.id ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
