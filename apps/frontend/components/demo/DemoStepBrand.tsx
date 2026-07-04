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
            // 1. Create a session on the server
            const sessionRes = await axios.post("/demo/session");
            const { session_id } = sessionRes.data;

            // 2. Create the brand under the session
            const brandRes = await axios.post("/demo/brand", {
                session_id,
                brand_name: brandName.trim(),
                description: description.trim(),
            });

            const brand = brandRes.data;

            // 3. Move to next step
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
        <div className="mx-auto max-w-xl px-4 py-8">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 md:p-8 shadow-2xl backdrop-blur-md">
                <h2 className="text-xl font-semibold text-white">Step 1: Register Your Brand</h2>
                <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    VerityAI tracks how your brand is represented in AI systems. Tell us the name and brief description of your brand to start.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="brand_name" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
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
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20 focus:bg-white/10 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                            Brand Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            disabled={loading}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. A technology startup providing serverless cloud databases and edge computing platforms."
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/20 focus:bg-white/10 disabled:opacity-50 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !brandName.trim()}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
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
