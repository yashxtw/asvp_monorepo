"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { getCurrentUser, logout } from "@/lib/auth";

type MeResponse = {
    user_id: string;
    customer_id: string;
    email: string;
    iat?: number;
    exp?: number;
};

type AccountStat = {
    title: string;
    value: string;
};

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                setLoading(true);
                const currentUser = await getCurrentUser();
                setUser(currentUser);
                if (!currentUser) {
                    setError("You are not signed in.");
                }
            } catch {
                setError("Failed to load account details.");
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    const sessionExpiry = useMemo(() => {
        if (!user?.exp) {
            return "Unknown";
        }

        return new Date(user.exp * 1000).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, [user?.exp]);

    const stats: AccountStat[] = useMemo(
        () =>
            user
                ? [
                    { title: "Email", value: user.email },
                    { title: "Customer ID", value: user.customer_id },
                    { title: "User ID", value: user.user_id },
                    { title: "Session Expires", value: sessionExpiry },
                ]
                : [],
        [sessionExpiry, user]
    );

    async function handleLogout() {
        try {
            setLoggingOut(true);
            await logout();
            router.push("/");
            router.refresh();
        } catch {
            setError("Failed to log out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <main className="pt-28 sm:pt-0 space-y-8">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold">Account</h1>
                <p className="text-sm text-gray-600">
                    View your account details and manage your current session.
                </p>
            </div>

            {loading && (
                <div className="pt-2">
                    <Loading />
                </div>
            )}

            {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && user && (
                <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => (
                            <AccountStatCard key={stat.title} title={stat.title} value={stat.value} />
                        ))}
                    </div>

                    <section className="rounded-2xl border-t border-zinc-300 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Signed-In Session</h2>
                                <p className="text-sm text-gray-600">
                                    You are currently signed in as{" "}
                                    <span className="font-medium text-zinc-900">{user.email}</span>.
                                </p>
                                <div className="rounded-xl bg-gray-100 p-4 text-sm text-zinc-800">
                                    This device has access to your dashboard, brands, queries, alerts,
                                    and analytics until the current session expires or you log out.
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="rounded-lg w-32 border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {loggingOut ? "Logging out..." : "Log Out"}
                            </button>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

function AccountStatCard({ title, value }: AccountStat) {
    return (
        <div className="rounded-2xl bg-gray-100 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-800">{title}</p>
            <p className="mt-3 break-all text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}
