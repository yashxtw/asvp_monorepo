"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resendVerificationEmail } from "@/lib/auth";

function VerifyEmailSentInner() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleResend() {
        if (!email) {
            setError("Add your email to the URL to resend the verification link.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await resendVerificationEmail(email);
            setSuccess(result.message);
        } catch (err: any) {
            setError(err?.message || "Failed to resend verification email");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
            <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold">Check your email</h1>
                <p className="mt-2 text-sm text-zinc-600">
                    We sent a verification link{email ? ` to ${email}` : ""}. Verify your email before signing in.
                </p>

                {success && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6 space-y-3">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || !email}
                        className="w-full rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717] disabled:opacity-60"
                    >
                        {loading ? "Sending link..." : "Resend verification email"}
                    </button>

                    <Link
                        href="/signin"
                        className="block text-center text-sm font-medium text-[#44413E] underline hover:underline"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function VerifyEmailSentPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
                    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-zinc-600">Loading verification help...</p>
                    </div>
                </main>
            }
        >
            <VerifyEmailSentInner />
        </Suspense>
    );
}
