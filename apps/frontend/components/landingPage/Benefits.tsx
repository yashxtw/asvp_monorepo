"use client";

import { BarChart3, Brain, Eye, ShieldCheck, TrendingUp } from "lucide-react";

function BenefitCard({
    title,
    description,
    icon: Icon,
    className,
    titleClassName = "text-xl md:text-2xl",
    tone = "bg-white",
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
    titleClassName?: string;
    tone?: string;
}) {
    return (
        <div
            className={`${tone} ${className ?? ""} flex min-h-[240px] flex-col justify-between rounded-2xl p-6 transition hover:shadow-md md:p-8`}
        >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-zinc-200">
                <Icon className="h-6 w-6 text-[#171717]" />
            </div>

            <div className="space-y-3">
                <h3 className={`${titleClassName} font-semibold leading-tight text-[#171717]`}>{title}</h3>
                <p className="text-sm leading-7 text-zinc-600 md:text-base">{description}</p>
            </div>
        </div>
    );
}

export default function BenefitsSection() {
    return (
        <section className="py-10 text-[#171717]">
            <div className="mx-auto max-w-7xl px-6 md:px-20">
                <div className="mx-auto mb-10 max-w-4xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                        <span className="text-[#1E3A8A]">What makes</span> VerityAI useful{" "}
                        <span className="text-[#1E3A8A]">in real workflows.</span>
                    </h2>
                    <p className="mt-6 text-lg text-zinc-600">
                        This is not just a dashboard of vague AI mentions. The platform is designed to help teams
                        understand performance across sources, prioritize fixes, and build a repeatable operating
                        rhythm around AI visibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                    <BenefitCard
                        title="Competitive intelligence"
                        description="Spot when competitors are recommended instead of you, which entities appear beside them, and where your brand disappears from answer sets."
                        icon={Eye}
                        tone="bg-zinc-100"
                        className="md:col-span-3"
                        titleClassName="text-xl"
                    />

                    <BenefitCard
                        title="Cross-source AI monitoring"
                        description="Run the same query across ChatGPT, Gemini, Claude, and Google AI Overviews, then compare visibility, sentiment, prominence, and brand presence side by side. Instead of treating AI visibility as one blurry metric, your team can see exactly which platforms mention you, which ones prefer competitors, where sentiment shifts, and whether the weakness is a broad positioning problem or a source-specific gap that needs a more targeted response."
                        icon={Brain}
                        tone="bg-zinc-100"
                        className="md:col-span-6"
                    />

                    <BenefitCard
                        title="Actionable analytics"
                        description="Measure mention rate, average visibility, prominence, sentiment, and grouped executions so decisions come from evidence rather than intuition."
                        icon={BarChart3}
                        className="md:col-span-3 border-t border-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/20"
                        titleClassName="text-xl"
                    />

                    <BenefitCard
                        title="Query and brand operations"
                        description="Organize monitoring by brand and tracked query, schedule runs automatically, compare query performance by source, and make AI visibility a managed part of your growth process."
                        icon={TrendingUp}
                        className="md:col-span-6 border-t border-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/20"
                    />

                    <BenefitCard
                        title="Alerts and recommendations"
                        description="Detect visibility drops, negative shifts, and missing-brand answers early, then move directly into recommendations that explain the issue, the evidence behind it, and what to do next."
                        icon={ShieldCheck}
                        tone="bg-zinc-100"
                        className="md:col-span-6"
                    />
                </div>
            </div>
        </section>
    );
}
