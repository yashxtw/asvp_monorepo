import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest, setFrontendSessionCookie } from "../_utils";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const { backendResponse, json, errorResponse } = await proxyBackendAuthRequest(req, "/auth/verify-email", {
        method: "POST",
        body,
    });

    if (errorResponse || !backendResponse) {
        return errorResponse ?? NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
    }

    if (!backendResponse.ok) {
        return NextResponse.json(json || { error: "Failed to verify email" }, { status: backendResponse.status });
    }

    const res = NextResponse.json(json || {});
    if (json?.token) {
        setFrontendSessionCookie(res, req, json.token);
    }
    return res;
}
