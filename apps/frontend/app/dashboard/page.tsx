"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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

    useEffect(() => {
        async function loadBrands() {
            try {
                setLoadingBrands(true);
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE}/brands`,
                    { withCredentials: true }
                );
                const data = (Array.isArray(res.data) ? res.data : []) as DashboardBrand[];

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
                <VisibilityOverview
                    brandId={selectedBrandId}
                    dateRange={selectedDateRange}
                    onAverageVisibilityChange={setAverageVisibility}
                    onVisibilityChange={setVisibilityChange}
                />
            ) : (
                <div className="rounded-md border px-2 py-1 text-sm bg-blue-50 border-blue-500">
                    Select a brand to view visibility overview.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedBrandId ? (
                    <BrandMentionsDashboard
                        brandId={selectedBrandId}
                        dateRange={selectedDateRange}
                        onMentionsChange={setMentions}
                        onTotalResponsesChange={setTotalResponses}
                        onMentionRateChange={setMentionRate}
                        onMentionRateTrendChange={setMentionRateTrend}
                        onTotalResponsesTrendChange={setTotalResponsesTrend}
                    />
                ) : (
                    <div className="rounded-md border px-2 py-1 text-sm bg-blue-50 border-blue-500">
                        Select a brand to view brand mentions.
                    </div>
                )}

                {selectedBrandId ? (
                    <SentimentDashboard 
                        brandId={selectedBrandId}
                        dateRange={selectedDateRange}
                        onDominantSentimentChange={setDominantSentiment}
                        onSentimentTrendChange={setSentimentTrend}
                    />
                ) : (
                    <div className="rounded-md border px-2 py-1 text-sm bg-blue-50 border-blue-500">
                        Select a brand to view sentiment overview.
                    </div>
                )}
            </div>

            {selectedBrandId ? (
                <ProminenceDashboard 
                    brandId={selectedBrandId}
                    dateRange={selectedDateRange}
                    onAverageProminence={setAverageProminence}
                    onAveragePosition={setAverageProminencePosition}
                    onProminenceTrendChange={setProminenceTrend}
                />
            ) : (
                <div className="rounded-md border px-2 py-1 text-sm bg-blue-50 border-blue-500">
                    Select a brand to view prominence overview.
                </div>
            )}
        </div>
    );
}
