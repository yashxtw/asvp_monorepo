"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import VisibilityOverview from "@/components/dashboard/VisibilityOverview";
import KPIGrid from "@/components/dashboard/KPIGrid";
import BrandMentionsDashboard from "@/components/dashboard/BrandMentions";
import SentimentDashboard from "@/components/dashboard/Sentiment";
import ProminenceDashboard from "@/components/dashboard/prominence";
import {
    DashboardBrand,
    useBrandSelection,
} from "@/components/dashboard/BrandSelectionContext";
import axios from "@/lib/axios";

export default function DashboardPage() {
    const {
        brands,
        setBrands,
        selectedBrandId,
        setSelectedBrandId,
    } = useBrandSelection();

    const [loadingBrands, setLoadingBrands] = useState(true);
    const [brandLoadingError, setBrandLoadingError] = useState<string | null>(null);

    const [averageVisibility, setAverageVisibility] = useState<number | null>(null);
    const [visibilityChange, setVisibilityChange] = useState<string | null>(null);

    const [mentions, setMentions] = useState<number>(0);
    const [totalResponses, setTotalResponses] = useState<number>(0);
    const [mentionRate, setMentionRate] = useState<number>(0);
    const [mentionRateTrend, setMentionRateTrend] = useState<string | null>(null);
    const [totalResponsesTrend, setTotalResponsesTrend] = useState<string | null>(null);

    const [dominantSentiment, setDominantSentiment] = useState<"positive" | "neutral" | "negative" | null>(null);
    const [sentimentTrend, setSentimentTrend] = useState<string | null>(null);

    const [averageProminence, setAverageProminence] = useState<number | null>(null);
    const [averageProminenceposition, setAverageProminencePosition] = useState<string | null>(null);
    const [prominenceTrend, setProminenceTrend] = useState<string | null>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<"7d" | "30d">("30d");
    const [selectedSource, setSelectedSource] = useState("");

    const sourceOptions = useMemo(
        () => [
            { value: "", label: "All sources" },
            { value: "google_aio", label: "Google AIO" },
            { value: "gemini", label: "Gemini" },
            { value: "chatgpt", label: "ChatGPT" },
            { value: "claude", label: "Claude" },
        ],
        []
    );

    useEffect(() => {
        async function loadBrands() {
            try {
                setLoadingBrands(true);
                const res = await axios.get("/brands/for_dashboard");
                const json = await res.data;
                const data = (Array.isArray(json) ? json : []) as DashboardBrand[];

                setBrands(data);

                if (data.length > 0) {
                    const stillValid = data.some((b) => b.id === selectedBrandId);
                    if (!stillValid) {
                        setSelectedBrandId(data[0].id);
                    }
                } else {
                    setSelectedBrandId(null);
                }
            } catch {
                setBrandLoadingError("Failed to load brands");
                setBrands([]);
                setSelectedBrandId(null);
            } finally {
                setLoadingBrands(false);
            }
        }

        loadBrands();
    }, [setBrands, selectedBrandId, setSelectedBrandId]);

    useEffect(() => {
        if (selectedBrandId) {
            return;
        }

        setAverageVisibility(null);
        setVisibilityChange(null);
        setMentions(0);
        setTotalResponses(0);
        setMentionRate(0);
        setMentionRateTrend(null);
        setTotalResponsesTrend(null);
        setDominantSentiment(null);
        setSentimentTrend(null);
        setAverageProminence(null);
        setAverageProminencePosition(null);
        setProminenceTrend(null);
    }, [selectedBrandId]);

    const topBarBrands = useMemo(
        () => brands.map((b) => ({ id: b.id, name: b.brand_name })),
        [brands]
    );

    return (
        <div className="pt-28 sm:pt-0 space-y-3">
            <TopBar
                brands={topBarBrands}
                selectedBrandId={selectedBrandId}
                onSelectBrand={setSelectedBrandId}
                sourceOptions={sourceOptions}
                selectedSource={selectedSource}
                onSelectSource={setSelectedSource}
                selectedDateRange={selectedDateRange}
                onSelectDateRange={setSelectedDateRange}
                loading={loadingBrands}
                brandLoadingError={brandLoadingError}
            />

            <KPIGrid
                averageVisibility={averageVisibility}
                visibilityChange={visibilityChange}
                mentions={mentions}
                mentionRate={mentionRate}
                mentionRateTrend={mentionRateTrend}
                averageProminence={averageProminence}
                averageProminenceposition={averageProminenceposition}
                prominenceTrend={prominenceTrend}
                dominantSentiment={dominantSentiment}
                sentimentTrend={sentimentTrend}
                totalResponses={totalResponses}
                totalResponsesTrend={totalResponsesTrend}
            />

            {selectedBrandId ? (
                <>
                    <VisibilityOverview
                        brandId={selectedBrandId}
                        dateRange={selectedDateRange}
                        source={selectedSource}
                        onAverageVisibilityChange={setAverageVisibility}
                        onVisibilityChange={setVisibilityChange}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <BrandMentionsDashboard
                            brandId={selectedBrandId}
                            dateRange={selectedDateRange}
                            source={selectedSource}
                            onMentionsChange={setMentions}
                            onTotalResponsesChange={setTotalResponses}
                            onMentionRateChange={setMentionRate}
                            onMentionRateTrendChange={setMentionRateTrend}
                            onTotalResponsesTrendChange={setTotalResponsesTrend}
                        />

                        <SentimentDashboard
                            brandId={selectedBrandId}
                            dateRange={selectedDateRange}
                            source={selectedSource}
                            onDominantSentimentChange={setDominantSentiment}
                            onSentimentTrendChange={setSentimentTrend}
                        />
                    </div>

                    <ProminenceDashboard
                        brandId={selectedBrandId}
                        dateRange={selectedDateRange}
                        source={selectedSource}
                        onAverageProminence={setAverageProminence}
                        onAveragePosition={setAverageProminencePosition}
                        onProminenceTrendChange={setProminenceTrend}
                    />
                </>
            ) : (

                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Start here
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#171717]">
                        Select a brand to unlock the dashboard
                    </h1>
                </div>

            )}
        </div>
    );
}
