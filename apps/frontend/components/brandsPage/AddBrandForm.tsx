"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";

type props = {
    refreshBrands: () => Promise<void> | void;
};

export default function AddBrandForm({refreshBrands}: props) {
    const [name, setName] = useState("");
    const [urls, setUrls] = useState("");
    const [description, setDescription] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [competitors, setCompetitors] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [success, error]);

    async function submit() {
        if (!name.trim()) {
            setError("Brand name is required");
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            await axios.post("/brands", {
                brand_name: name.trim(),
                canonical_urls: urls
                    .split("\n")
                    .map((u) => u.trim())
                    .filter(Boolean),
                description: description.trim(),
                logo_url: logoUrl.trim(),
                competitors: competitors
                    .split("\n")
                    .map((c) => c.trim())
                    .filter(Boolean),
            });

            setSuccess("Brand created successfully");
            setName("");
            setUrls("");
            setDescription("");
            setLogoUrl("");
            setCompetitors("");
            refreshBrands();

        } catch (err: any) {
            setError(
                err?.response?.data?.error || "Failed to create brand"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg bg-white space-y-2">
            <div>
                <h1 className="text-lg font-semibold">Add Brand</h1>
                <p className="text-sm text-gray-500">
                    Define your brand details to start tracking AI visibility.
                </p>
            </div>

            {success && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    {success}
                </div>
            )}

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                </div>
            )}

            {/* Brand Name */}
            <div className="space-y-1">
                <label className="text-sm font-medium">Brand Name *</label>
                <input
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
            </div>

            {/* Two Column Compact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Logo URL</label>
                    <input
                        className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-black"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <input
                        className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-black"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Canonical URLs */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                    Canonical URLs
                </label>
                <textarea
                    rows={3}
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-black"
                    placeholder="https://yourbrand.com"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    disabled={loading}
                />
                <p className="text-xs text-gray-500">
                    One URL per line.
                </p>
            </div>

            {/* Competitors */}
            <div className="space-y-1">
                <label className="text-sm font-medium">
                    Competitors
                </label>
                <textarea
                    rows={2}
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-black"
                    placeholder="competitor.com"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    disabled={loading}
                />
                <p className="text-xs text-gray-500">
                    Optional. One per line.
                </p>
            </div>

            {/* Button */}
            <div className="pt-2">
                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full bg-black text-white py-1.5 rounded-md text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Brand"}
                </button>
            </div>
        </div>
    );
}
