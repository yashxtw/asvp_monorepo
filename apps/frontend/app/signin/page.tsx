"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Loading from "@/components/Loading";
import { loginWithGoogle } from "../../lib/auth";

export default function SigninPage() {
    const [loading, setLoading] = useState(false);

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

            <div className="flex items-center justify-center px-6">
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

                    <button
                        onClick={() => {
                            setLoading(true);
                            loginWithGoogle();
                        }}
                        disabled={loading}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white py-2.5 text-sm font-medium text-[#171717] transition hover:bg-gray-50"
                    >
                        <Image src="/google.png" unoptimized alt="Google" width={16} height={16} />
                        Sign in with Google
                        <span>{loading && <Loading />}</span>
                    </button>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px w-full bg-gray-300" />
                        <span className="text-xs text-gray-500">or</span>
                        <div className="h-px w-full bg-gray-300" />
                    </div>

                    <form className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                            />
                        </div>

                        <div className="flex justify-end text-xs">
                            <Link href="/forgot-password" className="text-[#44413E] hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full cursor-pointer rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717]"
                        >
                            Sign In
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
