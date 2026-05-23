"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth";
import { isBusinessEmail, validateEmail } from "@/lib/passwordValidation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateEmail(email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!isBusinessEmail(email)) {
            setError("Please use your business email address, not a personal inbox like Gmail.");
            return;
        }

        try {
            setLoading(true);
            const res = await requestPasswordReset(email);
            setSuccess(res.message);
        } catch (err: any) {
            setError(err?.message || "Failed to request password reset");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
            <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold">Forgot password</h1>
                <p className="mt-2 text-sm text-zinc-600">
                    Enter the email connected to your account and we&apos;ll send you a reset link.
                </p>
                <p className="mt-2 text-xs font-medium text-amber-700">
                    Business email only. Personal inboxes like Gmail are not supported.
                </p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {success}
                    </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717] disabled:opacity-60"
                    >
                        {loading ? "Sending reset link..." : "Send reset link"}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-600">
                    Remembered it?{" "}
                    <Link href="/signin" className="font-medium text-[#44413E] underline hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
