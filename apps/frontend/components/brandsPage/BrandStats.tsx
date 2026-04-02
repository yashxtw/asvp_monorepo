"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import AddBrandForm from "../brandsPage/AddBrandForm"

type KPI = {
    title: string
    value: number | string
}

export default function KPIGrid({
    brandsCount,
    queryCount,
    activeQueryCount,
    refreshBrands,
}: {
    brandsCount: number
    queryCount: number
    activeQueryCount: number
    refreshBrands: () => void
}) {

    const [showAddBrand, setShowAddBrand] = useState(false)

    const kpis: KPI[] = [
        { title: "Total Brands", value: brandsCount },
        { title: "Total Queries", value: queryCount },
        { title: "Active Queries", value: activeQueryCount },
    ]

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

                {/* Add Brand Card */}
                <div
                    onClick={() => setShowAddBrand(true)}
                    className="bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:shadow-md transition"
                >
                    <Plus className="w-6 h-6 text-zinc-500 mb-2" />
                    <p className="text-sm font-medium text-zinc-600">
                        Add Brand
                    </p>
                </div>

                {kpis.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            {/* Add Brand Modal */}
            {showAddBrand && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-125 relative">

                        <button
                            onClick={() => setShowAddBrand(false)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <AddBrandForm refreshBrands={refreshBrands} />

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