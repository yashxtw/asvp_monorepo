"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function DemoLimitReached() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
            <div className="max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertCircle className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Demo Limit Reached
                </h2>
                
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                    You have reached the maximum of 2 demo sessions per browser/IP address. We enforce this limit because each session runs live queries against multiple LLMs.
                </p>

                <p className="mt-4 text-sm font-medium text-white/80">
                    Create a free account to continue tracking your brand's presence across ChatGPT, Gemini, Claude, and Google AIO.
                </p>

                <div className="mt-8 space-y-3">
                    <Link
                        href="/signup"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 hover:scale-[1.01]"
                    >
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                        href="/signin"
                        className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
