import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest } from "../_utils";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const { backendResponse, json } = await proxyBackendAuthRequest(req, "/auth/forgot-password", {
        method: "POST",
        body,
    });

    return NextResponse.json(json || {}, { status: backendResponse.status });
}
