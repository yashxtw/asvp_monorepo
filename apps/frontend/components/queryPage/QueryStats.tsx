"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import AddQueryForm from "../queryPage/AddQueryForm"

type KPI = {
    title: string
    value: number | string
}

type Query = {
    id: string
    is_active: boolean
    is_paused: boolean
    runs: number
    runs_7d: number
    failed_runs_7d: number
    success_runs_7d: number
    runs_24h: number
    failed_runs_24h: number
}

export default function KPIGrid({
    brands,
    queries,
    onCreated,
}: {
    brands: any[]
    queries: Query[]
    onCreated: () => void
}) {

    const [showAddQuery, setShowAddQuery] = useState(false)

    const totalQueries = queries.length
    const activeQueries = queries.filter((q) => q.is_active).length
    const pausedQueries = queries.filter((q) => q.is_active && q.is_paused).length
    const inactiveQueries = queries.filter((q) => !q.is_active).length
    const queriesNeverRun = queries.filter((q) => Number(q.runs) === 0).length

    const runs7d = queries.reduce((sum, q) => sum + Number(q.runs_7d || 0), 0)
    const successRuns7d = queries.reduce((sum, q) => sum + Number(q.success_runs_7d || 0), 0)
    const failedRuns7d = queries.reduce((sum, q) => sum + Number(q.failed_runs_7d || 0), 0)

    const runs24h = queries.reduce((sum, q) => sum + Number(q.runs_24h || 0), 0)
    const failedRuns24h = queries.reduce((sum, q) => sum + Number(q.failed_runs_24h || 0), 0)

    const runSuccessRate7d = runs7d > 0 ? ((successRuns7d / runs7d) * 100).toFixed(1) : "0.0"

    const kpis: KPI[] = [
        { title: "Total Queries", value: totalQueries },
        { title: "Active Queries", value: activeQueries },
        { title: "Paused Queries", value: pausedQueries },
        { title: "Inactive Queries", value: inactiveQueries },
        { title: "Run Success Rate (7d)", value: `${runSuccessRate7d}%` },
        { title: "Runs (24h / 7d)", value: `${runs24h} / ${runs7d}` },
        { title: "Queries Never Run", value: queriesNeverRun },
        { title: "Failed Runs (24h / 7d)", value: `${failedRuns24h} / ${failedRuns7d}` },
    ]

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

                {/* Add Query Card */}
                <div
                    onClick={() => setShowAddQuery(true)}
                    className="bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:shadow-md transition"
                >
                    <Plus className="w-6 h-6 text-zinc-500 mb-2" />
                    <p className="text-sm font-medium text-zinc-600">
                        Add Query
                    </p>
                </div>

                {kpis.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            {/* Add Query Modal */}
            {showAddQuery && (
                <div className="fixed inset-0 bg-black/40 h-screen flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-125 relative">

                        <button
                            onClick={() => setShowAddQuery(false)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <AddQueryForm brands={brands} onCreated={onCreated} />

                    </div>
                </div>
            )}
        </>
    )
}

function KPICard({ title, value }: KPI) {
    const isNumber = typeof value === "number"

    const [displayValue, setDisplayValue] = useState(0)

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

    return (
        <div className="bg-white border-t border-zinc-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">


            <p className="text-xs font-medium text-zinc-800">{title}</p>

            <div className="mt-3 items-end justify-between">
                <h2 className="text-3xl font-semibold text-gray-900">
                    <span className="text-3xl font-semibold text-gray-900">
                        {isNumber ? displayValue : value}
                    </span>
                </h2>
            </div>
        </div>
    )
}
