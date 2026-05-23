import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest } from "../../_utils";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token") || "";
    const { backendResponse, json } = await proxyBackendAuthRequest(
        req,
        `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
        { method: "GET" }
    );

    return NextResponse.json(json || {}, { status: backendResponse.status });
}
