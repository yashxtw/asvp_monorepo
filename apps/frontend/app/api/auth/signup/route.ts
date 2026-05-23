import { NextRequest, NextResponse } from "next/server";
import { proxyBackendAuthRequest } from "../_utils";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const { backendResponse, json, errorResponse } = await proxyBackendAuthRequest(req, "/auth/signup", {
        method: "POST",
        body,
    });

    if (errorResponse || !backendResponse) {
        return errorResponse ?? NextResponse.json({ error: "Failed to sign up" }, { status: 500 });
    }

    return NextResponse.json(json || {}, { status: backendResponse.status });
}
