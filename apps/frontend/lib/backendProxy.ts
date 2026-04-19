import { NextResponse } from "next/server";

function getBackendApiBase() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;

    if (!apiBase) {
        throw new Error("Backend API base URL is not configured");
    }

    return apiBase;
}

export async function proxyBackendRequest(req: Request, path: string) {
    let apiBase: string;
    try {
        apiBase = getBackendApiBase();
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Backend API base URL is not configured" },
            { status: 500 }
        );
    }

    const incomingUrl = new URL(req.url);
    const search = incomingUrl.search || "";
    const contentType = req.headers.get("content-type");
    const method = req.method.toUpperCase();
    const headers: Record<string, string> = {
        cookie: req.headers.get("cookie") || "",
    };

    if (contentType) {
        headers["content-type"] = contentType;
    }

    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await req.text() : undefined;

    const res = await fetch(`${apiBase}${path}${search}`, {
        method,
        credentials: "include",
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
    });

    if (!res.ok) {
        let error = "Request failed";

        try {
            const json = await res.json();
            if (json?.error && typeof json.error === "string") {
                error = json.error;
            }
        } catch {
            // Ignore parse failures and fall back to generic message.
        }

        return NextResponse.json({ error }, { status: res.status });
    }

    const responseContentType = res.headers.get("content-type") || "application/json";
    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: {
            "content-type": responseContentType,
        },
    });
}

export async function proxyBackendGet(req: Request, path: string) {
    return proxyBackendRequest(req, path);
}
