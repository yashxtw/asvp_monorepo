"use client";

import { useEffect, useState } from "react";
import { Play, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";

type DemoStepRunProps = {
    sessionId: string;
    queries: any[];
    onComplete: () => void;
};

const progressSteps = [
    "Initializing search engine agents...",
    "Querying ChatGPT and parsing responses...",
    "Retrieving Gemini citations...",
    "Fetching Claude and Google AI Overviews...",
    "Extracting brand prominence and snippets...",
    "Running NLP models for sentiment analysis...",
    "Finalizing search visibility indices...",
];

export default function DemoStepRun({ sessionId, queries, onComplete }: DemoStepRunProps) {
    const [running, setRunning] = useState(false);
    const [progressIndex, setProgressIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        setRunning(true);
        setError(null);
        setProgressIndex(0);

        try {
            await axios.post("/demo/run", {
                session_id: sessionId,
            });
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to trigger analysis run.");
            setRunning(false);
            return;
        }
    };

    // Progress simulation
    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setProgressIndex((prev) => {
                if (prev >= progressSteps.length - 1) {
                    clearInterval(interval);
                    // Add a tiny buffer before completing
                    setTimeout(() => {
                        onComplete();
                    }, 1000);
                    return prev;
                }
                return prev + 1;
            });
        }, 5000); // 5s per step * 7 steps = 35 seconds total runtime simulation

        return () => clearInterval(interval);
    }, [running, onComplete]);

    return (
        <div className="mx-auto max-w-xl px-4 py-8">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 md:p-8 shadow-2xl backdrop-blur-md text-center">
                <h2 className="text-xl font-semibold text-white">Step 3: Run AI Search Analysis</h2>
                <p className="mt-2 text-xs text-white/50 leading-relaxed max-w-md mx-auto">
                    We will execute your queries live against our integrations for ChatGPT, Gemini, Claude, and Google AIO. This will consume API keys and perform complete analysis.
                </p>

                {/* Query preview */}
                <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Queries to execute</span>
                    <div className="mt-2 space-y-1.5">
                        {queries.map((q) => (
                            <div key={q.id} className="flex items-center gap-2 text-sm text-white/80">
                                <ChevronRight className="h-3 w-3 text-white/40" />
                                {q.query_text}
                            </div>
                        ))}
                    </div>
                </div>

                {!running ? (
                    <div className="mt-8">
                        <button
                            onClick={handleRun}
                            className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90 hover:scale-[1.02]"
                        >
                            <Play className="h-4.5 w-4.5 fill-current" />
                            Trigger Live Analysis
                        </button>
                        <p className="mt-3 text-[10px] text-white/40">
                            Runs queries once only. Scheduled triggers are disabled in demo mode.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        {/* Custom loading bar */}
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                className="h-full bg-white transition-all duration-1000 ease-out"
                                style={{ width: `${((progressIndex + 1) / progressSteps.length) * 100}%` }}
                            />
                        </div>

                        {/* Loading step text */}
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-white/80" />
                            <p className="text-sm font-medium text-white/90 animate-pulse">
                                {progressSteps[progressIndex]}
                            </p>
                            <p className="text-xs text-white/40">
                                Running analysis. Please do not close or reload this page (~30s remaining).
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-6 text-xs text-red-400 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
