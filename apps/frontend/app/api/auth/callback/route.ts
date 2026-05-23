import { NextRequest, NextResponse } from "next/server";
import { setFrontendSessionCookie } from "../_utils";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect("/signin");
    }

    const res = NextResponse.redirect(
        new URL("/dashboard", req.url)
    );

    setFrontendSessionCookie(res, req, token);

    return res;
}
