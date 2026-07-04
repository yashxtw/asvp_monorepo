"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function DemoLimitReached() {
    return (
        <div className="flex min-h-[70vh] mt-10 flex-col items-center justify-center text-center px-4">
            <div className="max-w-md w-full p-8">
                <div className="mx-auto mb-5 h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/50">
                    <AlertCircle className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                    Demo limit reached
                </h2>
                
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    You have reached the maximum limit of 10 demo sessions. We limit usage because each session runs live API queries against LLM search engines.
                </p>

                <p className="mt-4 text-sm font-semibold text-zinc-800">
                    Create a free account to continue tracking your brand's presence across ChatGPT, Gemini, Claude, and Google AIO.
                </p>

                <div className="mt-8 space-y-3">
                    <Link
                        href="/signup"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:scale-[1.01] shadow-sm"
                    >
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                        href="/signin"
                        className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
