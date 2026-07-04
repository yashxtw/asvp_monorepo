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
    const activeLabel = stepLabels[currentStep - 1] || "";

    return (
        <>
            {/* Desktop Sidebar (visible on md and up) */}
            <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-zinc-200 p-8 flex-col justify-between z-30">
                <div className="space-y-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo_black.png" alt="VerityAI Logo" width={28} height={28} />
                        <span className="text-base font-bold tracking-tight text-zinc-950">
                            VerityAI <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full ml-1 font-medium">Demo</span>
                        </span>
                    </Link>

                    {/* Step list / Table of Contents */}
                    <div className="space-y-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Demo Steps
                        </span>
                        <nav className="space-y-1">
                            {stepLabels.map((label, idx) => {
                                const stepNum = idx + 1;
                                const isCompleted = stepNum < currentStep;
                                const isActive = stepNum === currentStep;

                                return (
                                    <div
                                        key={label}
                                        className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                            isActive
                                                ? "bg-zinc-50 text-zinc-900"
                                                : isCompleted
                                                  ? "text-zinc-500 hover:text-zinc-900"
                                                  : "text-zinc-300"
                                        }`}
                                    >
                                        <div
                                            className={`h-5 w-5 rounded-md flex items-center justify-center text-xs font-semibold border ${
                                                isActive
                                                    ? "bg-zinc-900 text-white border-zinc-900"
                                                    : isCompleted
                                                      ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                      : "bg-transparent text-zinc-300 border-zinc-200"
                                            }`}
                                        >
                                            {stepNum}
                                        </div>
                                        <span>{label}</span>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Footer action */}
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Step {currentStep} of {totalSteps}. Live AI search visibility mapping.
                    </p>
                    <Link
                        href="/signup"
                        className="block w-full text-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                        Sign Up for Free
                    </Link>
                </div>
            </aside>

            {/* Mobile Header (visible on screens below md) */}
            <header className="md:hidden w-full border-b border-zinc-200 bg-white px-4 py-3 sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo_black.png" alt="VerityAI Logo" width={24} height={24} />
                        <span className="text-sm font-bold text-zinc-950">VerityAI</span>
                    </Link>

                    <Link
                        href="/signup"
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                    >
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Step Progress Indicator */}
                <div className="mt-3 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                        <span>{activeLabel}</span>
                        <span>Step {currentStep} of {totalSteps}</span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-zinc-900 transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
            </header>
        </>
    );
}
