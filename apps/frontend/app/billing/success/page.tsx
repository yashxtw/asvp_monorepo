"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function BillingSuccessPage() {

    useEffect(() => {
        const rect = document
            .getElementById("confetti-anchor")
            ?.getBoundingClientRect();

        if (!rect) return;

        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 120,
            spread: 80,
            origin: { x, y }, // 🎯 center of heading
        });

    }, []);

    return (
        <main className="min-h-screen px-6 flex items-center justify-center text-[#171717]">
            <div className="w-full max-w-lg bg-white p-8 text-center space-y-4">
                
                <h1
                    id="confetti-anchor"
                    className="text-2xl font-semibold"
                >
                    Subscription created 🎉
                </h1>

                <p className="text-sm text-zinc-600">
                    Payment was submitted successfully. Your account will switch plans after the Razorpay webhook is received and verified.
                </p>

                <Link
                    href="/dashboard/usage"
                    className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                    Go to dashboard
                </Link>
            </div>
        </main>
    );
}