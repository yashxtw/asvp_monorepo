"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import axios from "@/lib/axios";

type DemoStepBrandProps = {
    onComplete: (sessionId: string, brandId: string, brandName: string) => void;
};

export default function DemoStepBrand({ onComplete }: DemoStepBrandProps) {
    const [brandName, setBrandName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandName.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const sessionRes = await axios.post("/demo/session");
            const { session_id } = sessionRes.data;

            const brandRes = await axios.post("/demo/brand", {
                session_id,
                brand_name: brandName.trim(),
                description: description.trim(),
            });

            const brand = brandRes.data;
            onComplete(session_id, brand.id, brand.brand_name);
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error;
            if (errMsg === "demo_limit_reached" || errMsg === "daily_demo_cap_exceeded") {
                setError("Demo session limit reached for your IP address or global cap reached.");
            } else {
                setError(err.response?.data?.error || "Failed to register brand. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className=" p-8 ">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-6">
                    Step 1
                </div>

                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Tell us about your brand</h2>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                    Enter your brand's name and description. We'll use this to analyze citations and brand sentiment across AI search engines.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="brand_name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Brand Name *
                        </label>
                        <input
                            type="text"
                            id="brand_name"
                            required
                            disabled={loading}
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            disabled={loading}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. A technology startup providing serverless cloud databases."
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 disabled:opacity-50 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !brandName.trim()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                Next: Create Queries
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
