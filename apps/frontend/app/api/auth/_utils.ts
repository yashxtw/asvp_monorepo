import { NextRequest, NextResponse } from "next/server";

export function setFrontendSessionCookie(res: NextResponse, req: NextRequest, token: string) {
    const isSecure = req.nextUrl.protocol === "https:";

    res.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
    });
}

type ProxyBackendAuthResult = {
    backendResponse: Response | null;
    json: any;
    text: string;
    errorResponse?: NextResponse;
};

export async function proxyBackendAuthRequest(
    req: NextRequest,
    backendPath: string,
    init?: {
        method?: string;
        body?: string;
    }
) {
    const backendBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!backendBase) {
        return {
            backendResponse: null,
            json: null,
            text: "",
            errorResponse: NextResponse.json(
                { error: "Backend API base URL is not configured" },
                { status: 500 }
            ),
        } satisfies ProxyBackendAuthResult;
    }

    const res = await fetch(`${backendBase}${backendPath}`, {
        method: init?.method || req.method,
        headers: {
            "content-type": req.headers.get("content-type") || "application/json",
            cookie: req.headers.get("cookie") || "",
        },
        body: init?.body,
        cache: "no-store",
        redirect: "manual",
    });

    const text = await res.text();
    let json: any = null;

    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    return {
        backendResponse: res,
        json,
        text,
    } satisfies ProxyBackendAuthResult;
}
