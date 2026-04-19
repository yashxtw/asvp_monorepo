"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/lib/axios";
import { UsageBar } from "@/components/UsageBar";
import PricingSection from "@/components/landingPage/SubscriptionPlans";
import Loading from "@/components/Loading";

type UsageResponse = {
    plan: "free" | "premium" | "custom";
    used: number;
    limit: number;
    billing_status: "inactive" | "pending" | "active";
    plan_expires_at: string | null;
};

const PLAN_LABELS: Record<UsageResponse["plan"], string> = {
    free: "Free",
    premium: "Premium",
    custom: "Custom",
};

const statusStyles: Record<UsageResponse["billing_status"], string> = {
    inactive: "bg-zinc-100 text-zinc-700",
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
};

export default function BillingUsagePage() {
    const [usage, setUsage] = useState<UsageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPricing, setShowPricing] = useState(false);

    const pricingRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        axios
            .get("/billing/usage")
            .then((res) => setUsage(res.data))
            .catch(() => setError("Failed to load usage"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (showPricing && pricingRef.current) {
            pricingRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [showPricing]);

    const usagePercent = useMemo(() => {
        if (!usage || usage.limit <= 0) return 0;
        return Math.min(100, Math.round((usage.used / usage.limit) * 100));
    }, [usage]);

    const expiryLabel = usage?.plan_expires_at
        ? new Date(usage.plan_expires_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "No active expiry";

    return (
        <main className="pt-28 sm:pt-0 space-y-8">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold">Usage & Billing</h1>
                <p className="text-sm text-gray-600">
                    Track your current plan, monthly usage, and billing status.
                </p>
            </div>

            {loading && (
                <div className="pt-2">
                    <Loading />
                </div>
            )}

            {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && usage && (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <UsageStatCard title="Current Plan" value={PLAN_LABELS[usage.plan]} />
                        <UsageStatCard title="Billing Status" value={usage.billing_status} badge={statusStyles[usage.billing_status]} />
                        <UsageStatCard title="Monthly Usage" value={`${usage.used} / ${usage.limit}`} />
                        <UsageStatCard title="Usage %" value={`${usagePercent}%`} />
                    </div>

                    <section className="rounded-2xl bg-white border-t border-zinc-300 p-4 shadow-sm space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold">Plan Overview</h2>
                                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[usage.billing_status]}`}>
                                        {usage.billing_status}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    Your current billing cycle and quota usage.
                                </p>
                            </div>

                            {usage.plan !== "custom" && (
                                <button
                                    onClick={() => setShowPricing(true)}
                                    className="rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                >
                                    Upgrade Plan
                                </button>
                            )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-gray-100 p-4">
                                <p className="text-xs font-medium text-zinc-700">Billing Cycle</p>
                                <p className="mt-2 text-sm text-zinc-900">
                                    Plan expires on <span className="font-medium">{expiryLabel}</span>
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-100 p-4">
                                <p className="text-xs font-medium text-zinc-700">Usage Summary</p>
                                <p className="mt-2 text-sm text-zinc-900">
                                    You have used <span className="font-medium">{usage.used}</span> out of{" "}
                                    <span className="font-medium">{usage.limit}</span> runs this month.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gray-100 p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-zinc-900">Run Usage</span>
                                <span className="text-gray-600">{usagePercent}% used</span>
                            </div>
                            <UsageBar used={usage.used} limit={usage.limit} />
                        </div>
                    </section>

                    {showPricing && (
                        <section ref={pricingRef} className="space-y-3">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold italic">Plans.</h2>
                                <p className="text-sm text-gray-600">
                                    Choose a plan that fits your query volume and workflow.
                                </p>
                            </div>
                            <PricingSection />
                        </section>
                    )}
                </>
            )}
        </main>
    );
}

function UsageStatCard({
    title,
    value,
    badge,
}: {
    title: string;
    value: string;
    badge?: string;
}) {
    return (
        <div className="rounded-2xl bg-gray-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-800">{title}</p>
            {badge ? (
                <span className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${badge}`}>
                    {value}
                </span>
            ) : (
                <h2 className="mt-3 text-3xl font-semibold text-gray-900">{value}</h2>
            )}
        </div>
    );
}
