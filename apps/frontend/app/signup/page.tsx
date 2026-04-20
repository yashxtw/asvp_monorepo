"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Loading from "@/components/Loading";
import { AuthRequestError, loginWithGoogle, signUpWithEmail } from "../../lib/auth";
import { getPasswordChecks, isPasswordValid, validateEmail } from "@/lib/passwordValidation";

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

export default function SignupPage() {
    const router = useRouter();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [name, setName] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEmailValid = validateEmail(email);
    const isWorkspaceValid = workspaceName.trim().length >= 2;
    const isNameValid = name.trim().length >= 2;
    const isConfirmValid = confirmPassword.length > 0 && password === confirmPassword;
    const passwordOkay = isPasswordValid(password);

    const formReady = useMemo(
        () =>
            isNameValid &&
            isWorkspaceValid &&
            isEmailValid &&
            passwordOkay &&
            isConfirmValid &&
            !formLoading,
        [formLoading, isConfirmValid, isEmailValid, isNameValid, isWorkspaceValid, passwordOkay]
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        if (!formReady) {
            setSubmitError("Please complete all fields and satisfy the password requirements.");
            return;
        }

        try {
            setFormLoading(true);
            const result = await signUpWithEmail({
                name,
                workspaceName,
                email,
                password,
                confirmPassword,
            });
            router.push(`/verify-email-sent?email=${encodeURIComponent(result.email)}`);
            router.refresh();
        } catch (error: any) {
            if (error instanceof AuthRequestError && error.status === 403) {
                router.push("/no-access");
                return;
            }

            setSubmitError(error?.message || "Failed to create account");
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

                    <h1 className="text-2xl font-semibold text-[#171717]">Create your account</h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        Start tracking how AI answers represent your brand, where competitors outrank you, and what
                        your team should improve next.
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
                        Sign up with Google
                        <span>{googleLoading && <Loading />}</span>
                    </button>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px w-full bg-gray-300" />
                        <span className="text-xs text-gray-500">or</span>
                        <div className="h-px w-full bg-gray-300" />
                    </div>

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Full name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                            />
                            {name.length > 0 && !isNameValid && (
                                <p className="mt-1 text-xs text-red-600">Enter your full name.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Workspace name</label>
                            <input
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                                placeholder="Example: Acme Growth Team"
                            />
                            {workspaceName.length > 0 && !isWorkspaceValid && (
                                <p className="mt-1 text-xs text-red-600">Workspace name must be at least 2 characters.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                            />
                            {email.length > 0 && !isEmailValid && (
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
                            <PasswordChecklist password={password} />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Confirm password</label>
                            <div className="relative mt-1">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#44413E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !isConfirmValid && (
                                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!formReady}
                            className="mt-2 w-full cursor-pointer rounded-lg bg-[#44413E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {formLoading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs text-gray-600">
                        Already have an account?{" "}
                        <Link href="/signin" className="font-medium text-[#44413E] underline hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
