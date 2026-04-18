import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect("/signin");
    }

    const res = NextResponse.redirect(
        new URL("/dashboard", req.url)
    );

    // Cookie is set by Next.js (same origin)
    res.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "none", // no cross-site , none for cross-site, lax for same-site
        secure: true,   // localhost: false, production: true
        path: "/",
    });

    return res;
}
