"use client";

export async function getCurrentUser() {
    try {
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
    } catch (err) {
        throw err;
    }
}

export function loginWithGoogle() {
    window.location.href = "/api/auth/google";
}

export async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
    }).catch(() => null);

    const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to log out");
    }
}
