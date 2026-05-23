import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest } from "../../_utils";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token") || "";
    const { backendResponse, json, errorResponse } = await proxyBackendAuthRequest(
        req,
        `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
        { method: "GET" }
    );

    if (errorResponse || !backendResponse) {
        return errorResponse ?? NextResponse.json({ error: "Failed to validate reset link" }, { status: 500 });
    }

    return NextResponse.json(json || {}, { status: backendResponse.status });
}
