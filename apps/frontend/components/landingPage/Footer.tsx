"use client";

import Link from "next/dist/client/link";

export default function Footer() {
    return (
        <footer className="relative overflow-hidden bg-white text-[#171717]">
            <div className="pointer-events-none flex items-end justify-center">
                <h1
                    className="
                    text-[22vw]
                    font-extrabold
                    tracking-tight
                    text-zinc-300/40
                    leading-none
                    select-none
                    mask-[linear-gradient(to_bottom,black_60%,transparent)]
                "
                >
                    VerityAI
                </h1>
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-5 md:px-20">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
                    <div className="text-xs opacity-80 md:text-sm">
                        Verity AI. Built for teams learning how their brand appears inside AI answers. © 2026
                    </div>

                    <div className="text-xs opacity-80 hover:underline md:text-sm">
                        <Link href="/feedback">Feedback</Link>
                    </div>

                    <div className="flex items-center gap-5">
                        <a
                            href="https://www.linkedin.com/company/111864988/"
                            target="_blank"
                            className="opacity-80 transition hover:opacity-100"
                        >
                            <img src="/linkedin (2).png" alt="LinkedIn" className="h-5 md:h-6" />
                        </a>

                        <a
                            href="https://x.com/verity_ai"
                            target="_blank"
                            className="opacity-80 transition hover:opacity-100"
                        >
                            <img src="/twitter (2).png" alt="X" className="h-5 md:h-6" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
