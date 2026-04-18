import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
            cookie: req.headers.get("cookie") || "",
        },
    }).catch(() => null);

    const res = NextResponse.json({ success: true });
    res.cookies.delete("auth_token");
    return res;
}
