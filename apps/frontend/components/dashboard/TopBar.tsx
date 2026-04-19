"use client"

import { useEffect, useRef, useState } from "react"
import { Download, ChevronDown } from "lucide-react"
import Loading from "@/components/Loading";

type Brand = {
    id: string
    name: string
}

type SourceOption = {
    value: string
    label: string
}

type TopBarProps = {
    brands: Brand[]
    selectedBrandId: string | null
    onSelectBrand: (brandId: string) => void
    sourceOptions: SourceOption[]
    selectedSource: string
    onSelectSource: (source: string) => void
    selectedDateRange: "7d" | "30d"
    onSelectDateRange: (range: "7d" | "30d") => void
    loading: boolean
    brandLoadingError: string | null
}

export default function TopBar({
    brands,
    selectedBrandId,
    onSelectBrand,
    sourceOptions,
    selectedSource,
    onSelectSource,
    selectedDateRange,
    onSelectDateRange,
    loading,
    brandLoadingError
}: TopBarProps) {
    const [showBrandDropdown, setShowBrandDropdown] = useState(false)
    const [showSourceDropdown, setShowSourceDropdown] = useState(false)
    const [showDateDropdown, setShowDateDropdown] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const dateOptions = [
        { label: "Last 7 days", value: "7d" as const },
        { label: "Last 30 days", value: "30d" as const },
    ]

    const selectedBrand =
        brands.find((brand) => brand.id === selectedBrandId) || null
    const selectedSourceLabel =
        sourceOptions.find((option) => option.value === selectedSource)?.label || "All sources"

    const handleExport = () => {
        const selectedLabel = dateOptions.find((option) => option.value === selectedDateRange)?.label || "Last 7 days"
        alert(`Exporting data for ${selectedBrand?.name || "Unknown"} (${selectedLabel})`)
    }

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (!containerRef.current) {
                return
            }

            if (!containerRef.current.contains(event.target as Node)) {
                setShowBrandDropdown(false)
                setShowSourceDropdown(false)
                setShowDateDropdown(false)
            }
        }

        document.addEventListener("mousedown", handleOutsideClick)
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="flex flex-col gap-3 border-b border-zinc-300 bg-white px-2 py-2 sm:flex-row sm:items-center sm:justify-between"
        >

            {/* LEFT - Brand Selector  */}
            <div className="relative flex w-full min-w-0 items-center gap-3 sm:w-auto">
                <button
                    onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                    className="flex min-w-0 items-center gap-2 text-left text-sm font-medium transition"
                >
                    <span className="truncate">
                        {selectedBrand?.name || "Select brand"}
                    </span>
                    <ChevronDown size={16} />
                </button>

                {loading && <Loading />}
                {brandLoadingError && <span className="text-xs text-red-500">{brandLoadingError}</span>}

                {showBrandDropdown && (
                    <div className="absolute left-0 top-5 z-50 mt-2 w-48 border bg-white shadow-lg">
                        {brands.map((brand) => (
                            <button
                                key={brand.id}
                                onClick={() => {
                                    onSelectBrand(brand.id)
                                    setShowBrandDropdown(false)
                                }}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100"
                            >
                                {brand.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT SIDE */}
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap sm:justify-end">
                <div className="relative">
                    <button
                        onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                        className="flex items-center gap-2 text-sm font-medium transition"
                    >
                        {selectedSourceLabel}
                        <ChevronDown size={16} />
                    </button>

                    {showSourceDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg z-50">
                            {sourceOptions.map((option) => (
                                <button
                                    key={option.value || "all"}
                                    onClick={() => {
                                        onSelectSource(option.value)
                                        setShowSourceDropdown(false)
                                    }}
                                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Range */}
                <div className="relative">
                    <button
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                        className="flex items-center gap-2 text-sm font-medium transition"
                    >
                        {dateOptions.find((option) => option.value === selectedDateRange)?.label || "Last 7 days"}
                        <ChevronDown size={16} />
                    </button>

                    {showDateDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg z-50">
                            {dateOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onSelectDateRange(option.value)
                                        setShowDateDropdown(false)
                                    }}
                                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Export Button */}
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                </button>

            </div>
        </div>
    )
}
