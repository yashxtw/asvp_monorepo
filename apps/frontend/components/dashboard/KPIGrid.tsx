"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

type KPI = {
    title: string
    value?: number | string
    trend?: string | null
    mentions?: number
    total?: number
    position?: string | number
}

function formatSentimentLabel(label: "positive" | "neutral" | "negative" | null) {
    if (!label) return "Neutral";
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function KPIGrid({
    averageVisibility,
    visibilityChange,
    dominantSentiment,
    sentimentTrend,
    averageProminence,
    averageProminenceposition,
    prominenceTrend,
    mentions,
    totalResponses,
    mentionRate,
    mentionRateTrend,
    totalResponsesTrend,
}: {
    averageVisibility: number | null;
    visibilityChange: string | null;
    dominantSentiment: "positive" | "neutral" | "negative" | null;
    sentimentTrend: string | null;
    averageProminence: number | null;
    averageProminenceposition: string | null;
    prominenceTrend: string | null;
    mentions: number;
    totalResponses: number;
    mentionRate: number;
    mentionRateTrend: string | null;
    totalResponsesTrend: string | null;
}) {
    const kpis: KPI[] = [
        { title: "Visibility Score", value: averageVisibility ?? 0, trend: visibilityChange },
        {
            title: "Brand Mention Rate",
            mentions: mentions,
            total: totalResponses,
            value: mentionRate,
            trend: mentionRateTrend
        },
        { title: "Avg Prominence", value: averageProminence ?? 0, position: averageProminenceposition ?? "0", trend: prominenceTrend },
        { title: "Sentiment Score", value: formatSentimentLabel(dominantSentiment), trend: sentimentTrend },
        { title: "Total Answers", value: totalResponses, trend: totalResponsesTrend },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {kpis.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
            ))}
        </div>
    )
}

function KPICard({ title, value, trend, mentions, total, position }: KPI) {
    const isNumber = typeof value === "number"
    const hasNumericTrend = Boolean(trend && trend !== "N/A")

    const [displayValue, setDisplayValue] = useState(0)
    const [displayTrend, setDisplayTrend] = useState(0)

    const trendNumber = hasNumericTrend ? Number(trend!.replace("%", "").replace("+", "").replace("-", "")) : 0
    const trendSign = trend?.startsWith("-") ? -1 : 1

    const isPositiveTrend = trend?.startsWith("+")
    const isNegativeTrend = trend?.startsWith("-")

    // Value animation
    useEffect(() => {
        if (!isNumber) return

        let start = 0
        const duration = 2000
        const increment = value / (duration / 16)

        const counter = setInterval(() => {
            start += increment

            if (start >= value) {
                setDisplayValue(value)
                clearInterval(counter)
            } else {
                setDisplayValue(Number(start.toFixed(2)))
            }
        }, 16)

        return () => clearInterval(counter)
    }, [value, isNumber])

    // Trend animation
    useEffect(() => {
        if (!hasNumericTrend) {
            setDisplayTrend(0)
            return
        }

        let start = 0
        const duration = 700
        const increment = trendNumber / (duration / 16)

        const counter = setInterval(() => {
            start += increment

            if (start >= trendNumber) {
                setDisplayTrend(trendNumber)
                clearInterval(counter)
            } else {
                setDisplayTrend(Number(start.toFixed(2)))
            }
        }, 16)

        return () => clearInterval(counter)
    }, [hasNumericTrend, trendNumber])

    return (
        <div className="bg-white border-t border-zinc-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">


            <p className="text-xs font-medium text-zinc-800">{title}</p>

            <div className="mt-3 items-end justify-between">
                <h2 className="text-3xl font-semibold text-gray-900">
                    {title === "Brand Mention Rate" ? (
                        <div className="flex items-end justify-between w-full">
                            <div className="flex items-end">
                                <span className="text-3xl font-semibold text-gray-900">
                                    {mentions}
                                </span>
                                <span className="text-sm text-gray-500 ml-1 pb-1">
                                    /{total}
                                </span>
                            </div>

                            <span className="text-lg font-semibold text-gray-800">
                                {Number(value).toFixed(0)}%
                            </span>
                        </div>
                    ) : title === "Avg Prominence" ? (
                        <div className="flex items-end justify-between w-full">
                            <span className="text-3xl font-semibold text-gray-900">
                                {isNumber ? displayValue : value}
                            </span>

                            {position && (
                                <span className="text-xs text-gray-500 pb-1 pl-3">
                                    {position} th position
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-3xl font-semibold text-gray-900">
                            {isNumber ? displayValue : value}
                        </span>
                    )}
                </h2>

                {trend && (
                    <div
                        className={`flex items-center gap-1 text-sm font-medium transition-all duration-500 ${isPositiveTrend
                            ? "text-green-600"
                            : isNegativeTrend
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                    >
                        {hasNumericTrend && isPositiveTrend && (
                            <ArrowUpRight size={16} className="animate-pulse" />
                        )}

                        {hasNumericTrend && isNegativeTrend && (
                            <ArrowDownRight size={16} className="animate-pulse" />
                        )}

                        {hasNumericTrend ? (
                            <>
                                {trendSign < 0 ? "-" : "+"}
                                {displayTrend.toFixed(1)}%
                            </>
                        ) : (
                            "N/A"
                        )}
                    </div>
                )}
            </div>

            {/* Sentiment Badge */}
            {title === "Sentiment Score" && (
                <div
                    className={`mt-4 text-xs font-semibold px-3 py-1 rounded-full w-fit ${value === "Positive"
                        ? "bg-green-100 text-green-700"
                        : value === "Negative"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                >
                    {value}
                </div>
            )}

        </div>
    )
}
