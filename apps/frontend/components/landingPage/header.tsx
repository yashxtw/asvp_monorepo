"use client"

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/shadcn/button";

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-gray-700 hover:text-black transition"
        >
            {children}
        </Link>
    );
}

export default function Header() {
    const router = useRouter();
    return (
        <header className="w-full border-b bg-white/20 backdrop-blur-md fixed top-0 z-50">
            <div className="mx-auto max-w-7xl px-6 md:px-20 py-4 flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <Image src="/logo_black.png" alt="Logo" width={50} height={50} />
                    </div>
                    <span className="text-xl md:text-2xl font-bold text-[#171717] tracking-tight">
                        VerityAI
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/signin"
                        className="text-sm font-medium text-gray-700 hover:text-black transition"
                    >
                        Sign in
                    </Link>

                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-lg cursor-pointer bg-(--primary) px-5 py-2 text-sm font-semibold text-white hover:bg-black transition"
                    >
                        Dashboard
                    </Button>
                </div>
            </div>
        </header>
    );
}
