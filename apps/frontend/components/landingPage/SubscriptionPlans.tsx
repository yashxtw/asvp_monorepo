"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Check } from "lucide-react";
import { subscribeToPlan } from "@/lib/subscribeToPlan";

export default function PricingSection() {
    const plans = [
        {
            name: "Free",
            price: "INR 0",
            description: "Best for learning the workflow and validating the problem.",
            features: [
                "Get started with a small number of brands and tracked queries",
                "Explore dashboard, analytics, and basic visibility monitoring",
                "Understand how AI answer tracking fits your operating process",
                "Good for early evaluation and internal buy-in",
            ],
            popular: false,
            action: null,
        },
        {
            name: "Premium",
            price: "INR 999 / month",
            description: "For startups and growth teams ready to monitor actively.",
            features: [
                "Expanded brand and query monitoring capacity",
                "Cross-source tracking for ChatGPT, Gemini, Claude, and Google AIO",
                "Alerts for visibility drops, missing-brand responses, and sentiment changes",
                "Recommendation workflows to help the team respond faster",
                "Priority support when you need help interpreting the signal",
            ],
            popular: true,
            action: "premium" as const,
        },
        {
            name: "Custom",
            price: "Contact Us",
            description: "For agencies, multi-brand teams, and advanced workflows.",
            features: [
                "Higher-volume monitoring across many brands and query sets",
                "More flexible rollout for internal teams and stakeholders",
                "Custom reporting and implementation guidance",
                "Commercial support for long-term usage planning",
                "A setup that can adapt as your visibility program matures",
            ],
            popular: false,
            action: "custom" as const,
        },
    ];

    async function handleSubscribe(plan: "premium" | "custom") {
        try {
            const { payment_url } = await subscribeToPlan(plan);
            window.location.href = payment_url;
        } catch (err: any) {
            const message =
                err.response?.data?.details ||
                err.response?.data?.error ||
                "Failed to start subscription";
            alert(message);
        }
    }

    return (
        <section className="py-16 text-[#171717] text-center">
            <div className="max-w-7xl mx-auto px-8 md:px-20 ">
                <div className="text-center max-w-3xl mx-auto mb-10 py-10">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="text-[#1E3A8A]">Simple, transparent</span> pricing.
                    </h2>
                    <p className="mt-6 text-lg text-zinc-600">
                        Start by understanding the signal, then grow into a proper AI visibility operating system as your
                        team turns monitoring into action.
                    </p>
                </div>

                <div className="grid items-end gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg ${plan.popular ? "scale-105 border-primary shadow-xl" : "border-muted"
                                }`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1E3A8A] px-4 py-1 text-xs text-white">
                                    Most Popular
                                </span>
                            )}

                            <CardHeader className="space-y-2">
                                <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                                <p className="text-3xl font-bold">{plan.price}</p>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <ul className="space-y-3 text-left text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.action === "premium" && (
                                    <Button
                                        className="w-full cursor-pointer rounded-xl border"
                                        onClick={() => handleSubscribe("premium")}
                                    >
                                        Get Started
                                    </Button>
                                )}

                                {plan.action === "custom" && (
                                    <Button variant="outline" className="w-full cursor-pointer rounded-xl text-zinc-200">
                                        Contact Sales
                                    </Button>
                                )}

                                {!plan.action && (
                                    <Button disabled className="w-full rounded-xl border">
                                        Current Plan
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
