"use client";

import api from "./axios";

export class AuthRequestError extends Error {
    status: number;
    code?: string;
    email?: string;

    constructor(message: string, status: number, code?: string, email?: string) {
        super(message);
        this.name = "AuthRequestError";
        this.status = status;
        this.code = code;
        this.email = email;
    }
}

async function authRequest<T>(path: string, body: Record<string, unknown>) {
    const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new AuthRequestError(json?.error || "Authentication request failed", res.status, json?.code, json?.email);
    }

    return json as T;
}

export async function getCurrentUser() {
    const res = await fetch("/api/backend/me", {
        method: "GET",
        credentials: "include",
        headers: {
            "Cache-Control": "no-store",
        },
    });

    if (res.status === 401) {
        return null;
    }

    if (!res.ok) {
        throw new Error("Failed to fetch current user");
    }

    return res.json();
}

export function loginWithGoogle() {
    window.location.href = "/api/auth/google";
}

export async function signInWithEmail(email: string, password: string) {
    const json = await authRequest<{ token: string }>("/api/auth/signin", {
        email,
        password,
    });
    return json;
}

export async function signUpWithEmail(payload: {
    name: string;
    workspaceName: string;
    email: string;
    password: string;
    confirmPassword: string;
}) {
    const json = await authRequest<{ success: boolean; requiresEmailVerification: boolean; email: string; message: string }>(
        "/api/auth/signup",
        payload
    );
    return json;
}

export async function requestPasswordReset(email: string) {
    return authRequest<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });
}

export async function validateResetToken(token: string) {
    const res = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
        method: "GET",
        credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json?.error || "Reset link is invalid");
    }

    return json;
}

export async function resetPassword(payload: {
    token: string;
    password: string;
    confirmPassword: string;
}) {
    const json = await authRequest<
        | { token: string }
        | { success: boolean; requiresEmailVerification: boolean; message: string; email: string }
    >("/api/auth/reset-password", payload);

    return json;
}

export async function resendVerificationEmail(email: string) {
    return authRequest<{ success: boolean; message: string }>("/api/auth/resend-verification", { email });
}

export async function validateEmailVerificationToken(token: string) {
    const res = await fetch(`/api/auth/verify-email/validate?token=${encodeURIComponent(token)}`, {
        method: "GET",
        credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json?.error || "Verification link is invalid");
    }

    return json;
}

export async function verifyEmail(token: string) {
    const json = await authRequest<{ token: string }>("/api/auth/verify-email", { token });
    return json;
}

export async function logout() {
    await api.post("/auth/logout").catch(() => null);
    const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to log out");
    }
}
