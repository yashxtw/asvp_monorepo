export function getAuthCookieOptions() {
    const isSecure =
        process.env.NODE_ENV === "production" ||
        process.env.FRONTEND_URL?.startsWith("https://") === true;

    return {
        httpOnly: true,
        secure: isSecure,
        sameSite: (isSecure ? "none" : "lax") as "none" | "lax",
        path: "/",
    };
}
