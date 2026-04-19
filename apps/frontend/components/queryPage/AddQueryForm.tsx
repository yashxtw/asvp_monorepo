"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";

type Brand = {
    id: string;
    brand_name: string;
};

type Props = {
    brands: Brand[];
    onCreated: () => Promise<void> | void;
};

export default function AddQueryForm({ brands, onCreated }: Props) {
    const [queryText, setQueryText] = useState("");
    const [frequency, setFrequency] = useState("daily");
    const [queryType, setQueryType] = useState<
        "brand" | "category" | "competitor"
    >("category");
    const [brandId, setBrandId] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!error && !success) return;

        const timer = setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [error, success]);


    async function submit() {
        setError(null);
        setSuccess(null);

        if (!brandId) return setError("Please select a brand");
        if (!queryText.trim()) return setError("Query text cannot be empty");

        setLoading(true);

        try {
            await axios.post("/queries", {
                brand_id: brandId,
                query_text: queryText,
                query_type: queryType,
                frequency,
            });

            setSuccess("Query created successfully");
            setQueryText("");
            setFrequency("daily");
            setQueryType("category");
            await onCreated();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Failed to create query"
                );
            } else {
                setError("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="space-y-2 max-w-md w-full bg-white">
            <div className="flex justify-between">
                <h1 className="text-lg font-bold">Add Query</h1>
                {error && (
                    <div className="border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700 rounded-full">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="border border-green-300 bg-green-50 px-2 py-1 text-xs text-green-700 rounded-full">
                        {success}
                    </div>
                )}

            </div>



            <div className="space-y-1">
                <label className="text-xs font-medium">Brand</label>
                <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    disabled={loading}
                >
                    <option value="">Select brand</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.brand_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Query type</label>
                <select
                    value={queryType}
                    onChange={(e) =>
                        setQueryType(
                            e.target.value as "brand" | "category" | "competitor"
                        )
                    }
                    className="w-full border rounded px-2 py-1.5 text-sm"
                >
                    <option value="brand">Brand</option>
                    <option value="category">Category</option>
                    <option value="competitor">Competitor</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Query text</label>
                <input
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="e.g. best bike rental app"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Frequency</label>
                <select
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                </select>
            </div>

            <button
                onClick={submit}
                disabled={loading}
                className="bg-black text-white px-3 py-1.5 text-sm rounded disabled:opacity-60"
            >
                {loading ? "Saving..." : "Create Query"}
            </button>
        </section>
    );
}
