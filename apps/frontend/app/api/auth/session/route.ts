import { NextRequest, NextResponse } from "next/server";

function setFrontendSessionCookie(res: NextResponse, req: NextRequest, token: string) {
    const isSecure = req.nextUrl.protocol === "https:";

    res.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== "string") {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });
    setFrontendSessionCookie(res, req, token);
    return res;
}
