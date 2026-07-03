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
        <header className="w-full fixed top-0 z-50 px-6 md:px-20 pt-2">
            <div className="mx-auto rounded-2xl backdrop-blur-sm max-w-7xl px-2 py-2 flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <Image src="/logo_white.png" alt="Logo" width={50} height={50} />
                    </div>
                    <span className="text-xl md:text-2xl text-white/90 font-bold tracking-tight">
                        VerityAI
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/signin"
                        className="text-sm font-medium text-white/90 hover:text-black transition"
                    >
                        Sign in
                    </Link>

                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-lg cursor-pointer bg-white/90 px-5 py-2 text-sm font-semibold text-black transition"
                    >
                        Dashboard
                    </Button>
                </div>
            </div>
        </header>
    );
}
