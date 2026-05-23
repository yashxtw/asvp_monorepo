import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest, setFrontendSessionCookie } from "../_utils";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const { backendResponse, json } = await proxyBackendAuthRequest(req, "/auth/signin", {
        method: "POST",
        body,
    });

    if (!backendResponse.ok) {
        return NextResponse.json(json || { error: "Failed to sign in" }, { status: backendResponse.status });
    }

    const res = NextResponse.json(json || {});
    if (json?.token) {
        setFrontendSessionCookie(res, req, json.token);
    }
    return res;
}
