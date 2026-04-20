"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword, validateResetToken } from "@/lib/auth";
import { getPasswordChecks, isPasswordValid } from "@/lib/passwordValidation";

function PasswordChecklist({ password }: { password: string }) {
    const checks = getPasswordChecks(password);
    const items = [
        { label: "At least 8 characters", valid: checks.minLength },
        { label: "One uppercase letter", valid: checks.hasUppercase },
        { label: "One lowercase letter", valid: checks.hasLowercase },
        { label: "One number", valid: checks.hasNumber },
    ];

    return (
        <div className="mt-2 grid gap-1 text-xs">
            {items.map((item) => (
                <p key={item.label} className={item.valid ? "text-green-600" : "text-zinc-500"}>
                    {item.valid ? "OK" : "-"} {item.label}
                </p>
            ))}
        </div>
    );
}

function ResetPasswordInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validating, setValidating] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        async function validateToken() {
            if (!token) {
                setTokenError("Reset token is missing.");
                setValidating(false);
                return;
            }

            try {
                await validateResetToken(token);
                setTokenError(null);
            } catch (err: any) {
                setTokenError(err?.message || "This reset link is invalid or has expired.");
            } finally {
                setValidating(false);
            }
        }

        validateToken();
    }, [token]);

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const formReady = useMemo(
        () => !!token && isPasswordValid(password) && passwordsMatch && !submitting && !tokenError,
        [password, passwordsMatch, submitting, token, tokenError]
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        if (!formReady) {
            setSubmitError("Please fix the password requirements before continuing.");
            return;
        }

        try {
            setSubmitting(true);
            const result = await resetPassword({
                token,
                password,
                confirmPassword,
            });

            if ("token" in result) {
                router.push("/dashboard");
                router.refresh();
                return;
            }

            router.push(`/verify-email-sent?email=${encodeURIComponent(result.email)}`);
            router.refresh();
        } catch (err: any) {
            setSubmitError(err?.message || "Failed to reset password");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
            <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold">Reset password</h1>
                <p className="mt-2 text-sm text-zinc-600">
                    Choose a new password for your VerityAI account.
                </p>

                {validating && (
                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                        Validating reset link...
                    </div>
                )}

                {!validating && tokenError && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {tokenError}
                    </div>
                )}

                {!validating && !tokenError && (
                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        {submitError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {submitError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-700">New password</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <PasswordChecklist password={password} />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Confirm new password</label>
                            <div className="relative mt-1">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!formReady}
                            className="w-full rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717] disabled:opacity-60"
                        >
                            {submitting ? "Updating password..." : "Reset password"}
                        </button>
                    </form>
                )}

                <p className="mt-5 text-center text-xs text-gray-600">
                    Back to{" "}
                    <Link href="/signin" className="font-medium text-[#44413E] underline hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-white px-6 py-16 text-[#171717]">
                    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-zinc-600">Loading reset form...</p>
                    </div>
                </main>
            }
        >
            <ResetPasswordInner />
        </Suspense>
    );
}
