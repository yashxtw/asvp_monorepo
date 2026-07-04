"use client";

import Link from "next/link";
import { Lock, ArrowRight, Bell, Zap, TrendingDown, BookOpen } from "lucide-react";

export default function DemoStepLocked() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 relative overflow-hidden">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-white">Step 6: Alerts & AI Recommendations</h2>
                <p className="mt-1 text-xs text-white/50">
                    Get automated alerts and strategic suggestions based on visibility changes.
                </p>
            </div>

            {/* Blurred Mock Content Wrapper */}
            <div className="relative">
                {/* Visual Lock Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/45 backdrop-blur-sm rounded-2xl border border-white/[0.08]">
                    <div className="mx-auto h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white ring-8 ring-white/[0.03]">
                        <Lock className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">Unlock Live Alerts & AI Strategy</h3>
                    <p className="mt-2 text-xs text-white/60 max-w-md leading-relaxed">
                        VerityAI continuously aggregates search presence data. When a drop in visibility or a competitor mention spike occurs, we alert you instantly and generate content briefs to help you regain market share.
                    </p>
                    <p className="mt-2 text-[11px] text-white/40 max-w-xs">
                        Requires multi-day history tracking. Locked in demo mode.
                    </p>
                    <Link
                        href="/signup"
                        className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 hover:scale-[1.01]"
                    >
                        Create Account & Start Monitoring
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Simulated content (blurred) */}
                <div className="grid gap-6 md:grid-cols-2 opacity-15 filter blur-[3px] select-none pointer-events-none">
                    {/* Simulated Alerts */}
                    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Active Alerts
                            </h4>
                            <span className="text-[10px] text-white/40">Latest 24h</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                                <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-white/90">Visibility drop detected</p>
                                    <p className="mt-0.5 text-[10px] text-white/50">Acme Corp dropped by 12% in Gemini for "cloud database".</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                                <TrendingDown className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-white/90">Competitor mention spike</p>
                                    <p className="mt-0.5 text-[10px] text-white/50">Competitor TechSoft is now cited in 85% of Claude answers.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Recommendations */}
                    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Recommended Actions
                            </h4>
                            <span className="text-[10px] text-white/40">Tailored to your brand</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                                <BookOpen className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-white/90">Optimize landing page markup</p>
                                    <p className="mt-0.5 text-[10px] text-white/50">Add structured data schema matching developer specs to improve LLM scraping visibility.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                                <BookOpen className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-white/90">Publish comparison matrix</p>
                                    <p className="mt-0.5 text-[10px] text-white/50">Gemini searches fail to find your price specs. Publish a direct competitor comparison page.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
