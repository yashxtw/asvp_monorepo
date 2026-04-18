import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect("/signin");
    }

    const res = NextResponse.redirect(
        new URL("/dashboard", req.url)
    );

    const isSecure = req.nextUrl.protocol === "https:";

    // Frontend keeps its own cookie so Next middleware on the frontend domain
    // can protect dashboard routes. Backend sets its own cookie separately.
    res.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
    });

    return res;
}
