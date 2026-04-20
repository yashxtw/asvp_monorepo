"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { validateEmailVerificationToken, verifyEmail } from "@/lib/auth";

function VerifyEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function validateToken() {
            if (!token) {
                setError("Verification token is missing.");
                setStatus("error");
                return;
            }

            try {
                await validateEmailVerificationToken(token);
                setStatus("ready");
            } catch (err: any) {
                setError(err?.message || "This verification link is invalid or has expired.");
                setStatus("error");
            }
        }

        validateToken();
    }, [token]);

    async function handleVerify() {
        try {
            setStatus("submitting");
            setError(null);
            await verifyEmail(token);
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err?.message || "Failed to verify email");
            setStatus("error");
        }
    }

    return (
        <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
            <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold">Verify your email</h1>
                <p className="mt-2 text-sm text-zinc-600">
                    Confirm your email to activate your VerityAI account.
                </p>

                {status === "loading" && (
                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                        Validating verification link...
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {status === "ready" && (
                    <button
                        type="button"
                        onClick={handleVerify}
                        className="mt-6 w-full rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717]"
                    >
                        Verify email
                    </button>
                )}

                {status === "submitting" && (
                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                        Verifying your email...
                    </div>
                )}

                <p className="mt-5 text-center text-xs text-gray-600">
                    Need another link?{" "}
                    <Link href="/verify-email-sent" className="font-medium text-[#44413E] underline hover:underline">
                        Open verification help
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
                    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-zinc-600">Loading verification page...</p>
                    </div>
                </main>
            }
        >
            <VerifyEmailInner />
        </Suspense>
    );
}
