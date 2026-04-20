"use client";

import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/signin");
    }
    return user;
}
