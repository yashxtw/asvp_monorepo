import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

        const { payload } = await jwtVerify(token, secret);

        if (payload.email_verified !== true) {
            const email = typeof payload.email === "string" ? payload.email : "";
            const target = new URL("/verify-email-sent", request.url);
            if (email) {
                target.searchParams.set("email", email);
            }
            return NextResponse.redirect(target);
        }

        return NextResponse.next();
    } catch (error) {
        const response = NextResponse.redirect(new URL("/signin", request.url));
        response.cookies.delete("auth_token");
        return response;
    }
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
