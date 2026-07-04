"use client";

import Link from "next/link";
import { Lock, ArrowRight, Bell, Zap, TrendingDown, BookOpen } from "lucide-react";

export default function DemoStepLocked() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 relative overflow-hidden">
            <div className="text-center">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-4">
                    Step 6
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Alerts & recommendations</h2>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                    Track visibility drops, competitor spikes, and content optimization recommendations over time.
                </p>
            </div>

            {/* Blurred Content Wrapper */}
            <div className="relative">
                {/* Visual Lock Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-md p-2">
                        <Lock className="h-3 w-3" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-zinc-950">Unlock daily monitoring & strategy</h3>
                    <p className="mt-2 text-sm text-zinc-500 max-w-md leading-relaxed">
                        Get notified when your citations drop or competitors gain visibility. Receive AI-generated content recommendation briefs to improve your ranking.
                    </p>
                    <p className="mt-2 text-xs text-zinc-400 max-w-xs">
                        Requires multi-day history tracking. Locked in demo mode.
                    </p>
                    <Link
                        href="/signup"
                        className="mt-6 flex mb-1 items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:scale-[1.01]"
                    >
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Simulated Content (blurred) */}
                <div className="grid gap-6 md:grid-cols-2 opacity-20 filter blur-[2px] select-none pointer-events-none">
                    {/* Simulated Alerts */}
                    <div className=" p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-zinc-500" />
                                Active Alerts
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Latest 24h</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 p-3">
                                <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-red-900">Visibility drop detected</p>
                                    <p className="mt-0.5 text-[10px] text-red-700">Acme Corp dropped by 12% in Gemini for "cloud database".</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                                <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-900">Competitor mention spike</p>
                                    <p className="mt-0.5 text-[10px] text-amber-700">Competitor TechSoft is now cited in 85% of Claude answers.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Recommendations */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-zinc-500" />
                                Recommended Actions
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tailored to your brand</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
                                <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-900">Optimize landing page markup</p>
                                    <p className="mt-0.5 text-[10px] text-blue-700">Add structured data schema matching developer specs to improve LLM scraping visibility.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-100 p-3">
                                <BookOpen className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-green-900">Publish comparison matrix</p>
                                    <p className="mt-0.5 text-[10px] text-green-700">Gemini searches fail to find your price specs. Publish a direct competitor comparison page.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
