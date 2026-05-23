import { NextRequest, NextResponse } from "next/server";
import { setFrontendSessionCookie } from "../_utils";

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
