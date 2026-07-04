"use client";

import Link from "next/link";
import Image from "next/image";

type DemoHeaderProps = {
    currentStep: number;
    totalSteps: number;
};

const stepLabels = [
    "Register Brand",
    "Create Queries",
    "Run Analysis",
    "View Results",
    "Analytics Overview",
    "Advanced Features",
];

export default function DemoHeader({ currentStep, totalSteps }: DemoHeaderProps) {
    return (
        <header className="w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md px-6 py-4">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo_white.png" alt="VerityAI Logo" width={32} height={32} />
                    <span className="text-lg font-bold tracking-tight text-white/90">
                        VerityAI <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full ml-1 font-medium">Demo</span>
                    </span>
                </Link>

                {/* Step indicators */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                    {stepLabels.map((label, idx) => {
                        const stepNum = idx + 1;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;

                        return (
                            <div key={label} className="flex items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                                            isActive
                                                ? "bg-white text-black ring-2 ring-white/20"
                                                : isCompleted
                                                  ? "bg-white/20 text-white/80"
                                                  : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                                        }`}
                                    >
                                        {stepNum}
                                    </div>
                                    <span
                                        className={`text-xs font-medium hidden sm:inline transition ${
                                            isActive
                                                ? "text-white"
                                                : isCompleted
                                                  ? "text-white/60"
                                                  : "text-white/30"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </div>
                                {idx < totalSteps - 1 && (
                                    <div
                                        className={`h-[1px] w-4 md:w-8 ml-2 md:ml-4 bg-white/${
                                            stepNum < currentStep ? "20" : "06"
                                        }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action button */}
                <Link
                    href="/signup"
                    className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                    Sign Up
                </Link>
            </div>
        </header>
    );
}
