"use client";

import { useEffect, useState } from "react";
import { Play, Loader2, ChevronRight } from "lucide-react";
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

    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setProgressIndex((prev) => {
                if (prev >= progressSteps.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        onComplete();
                    }, 1000);
                    return prev;
                }
                return prev + 1;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [running, onComplete]);

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="p-8 text-center">
                {/* Minimalist Top Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-6">
                    Step 3
                </div>

                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Analyze search presence</h2>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
                    We will query ChatGPT, Gemini, Claude, and Google AIO in real-time to analyze your brand's citations and sentiment.
                </p>

                {/* Query preview */}
                <div className="mt-8 rounded-xl bg-zinc-50 border border-zinc-200 p-5 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Queries to execute</span>
                    <div className="mt-3 space-y-2">
                        {queries.map((q) => (
                            <div key={q.id} className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                                {q.query_text}
                            </div>
                        ))}
                    </div>
                </div>

                {!running ? (
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleRun}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:scale-[1.01]"
                        >
                            <Play className="h-4.5 w-4.5 fill-current" />
                            Trigger Live Analysis
                        </button>
                        <p className="text-[10px] text-zinc-400">
                            Runs queries once. Automated monitoring schedules are disabled in demo mode.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        {/* Progress Bar */}
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full bg-zinc-900 transition-all duration-1000 ease-out"
                                style={{ width: `${((progressIndex + 1) / progressSteps.length) * 100}%` }}
                            />
                        </div>

                        {/* Loading step text */}
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-800" />
                            <p className="text-sm font-semibold text-zinc-900">
                                {progressSteps[progressIndex]}
                            </p>
                            <p className="text-xs text-zinc-400">
                                Running analysis. Please do not close or refresh this page (~30s remaining).
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-6 text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
