"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Loading from "@/components/Loading";
import { AuthRequestError, loginWithGoogle, signInWithEmail } from "../../lib/auth";
import { validateEmail } from "@/lib/passwordValidation";

export default function SigninPage() {
    const router = useRouter();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);

    const emailTouched = email.length > 0;
    const passwordTouched = password.length > 0;
    const isEmailValid = validateEmail(email);
    const isPasswordValid = password.length >= 8;

    const formReady = useMemo(
        () => isEmailValid && isPasswordValid && !formLoading,
        [formLoading, isEmailValid, isPasswordValid]
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        if (!formReady) {
            setSubmitError("Please enter a valid email and password.");
            return;
        }

        try {
            setFormLoading(true);
            await signInWithEmail(email, password);
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            if (error instanceof AuthRequestError && error.code === "email_not_verified") {
                const targetEmail = error.email || email;
                router.push(`/verify-email-sent?email=${encodeURIComponent(targetEmail)}`);
                return;
            }

            setSubmitError(error?.message || "Failed to sign in");
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 bg-white lg:grid-cols-2">
            <div className="relative hidden lg:block">
                <Image
                    src="/logan-voss-PAoo2lm4m0k-unsplash.jpg"
                    alt="Verity AI"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            <div className="flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-2">
                        <Image src="/logo_black.png" alt="Verity AI" width={28} height={28} unoptimized />
                        <span className="text-lg font-semibold text-[#171717]">Verity AI</span>
                    </div>

                    <h1 className="text-2xl font-semibold text-[#171717]">Welcome back</h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        Sign in to monitor how AI systems describe your brand, compare competitors, and act on
                        visibility gaps with confidence.
                    </p>

                    {submitError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {submitError}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setGoogleLoading(true);
                            loginWithGoogle();
                        }}
                        disabled={googleLoading}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white py-2.5 text-sm font-medium text-[#171717] transition hover:bg-gray-50 disabled:opacity-70"
                    >
                        <Image src="/google.png" unoptimized alt="Google" width={16} height={16} />
                        Sign in with Google
                        <span>{googleLoading && <Loading />}</span>
                    </button>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px w-full bg-gray-300" />
                        <span className="text-xs text-gray-500">or</span>
                        <div className="h-px w-full bg-gray-300" />
                    </div>

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                            />
                            {emailTouched && !isEmailValid && (
                                <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Password</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {passwordTouched && !isPasswordValid && (
                                <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters.</p>
                            )}
                        </div>

                        <div className="flex justify-end text-xs">
                            <Link href="/forgot-password" className="text-[#44413E] hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={!formReady}
                            className="mt-2 w-full cursor-pointer rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {formLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-medium text-[#44413E] underline hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
