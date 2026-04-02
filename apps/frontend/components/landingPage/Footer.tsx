"use client";

import Link from "next/dist/client/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="relative overflow-hidden text-[#171717] bg-white">

            {/* BIG BACKGROUND TEXT */}
            <div className="pointer-events-none flex items-end justify-center ">
                <h1 className="
                    text-[22vw] 
                    font-extrabold 
                    tracking-tight 
                    text-zinc-300/40 
                    leading-none 
                    select-none
                    mask-[linear-gradient(to_bottom,black_60%,transparent)]
                ">
                    VerityAI
                </h1>
            </div>

            {/* FOOTER CONTENT */}
            <div className="relative mx-auto max-w-7xl px-6 md:px-20 py-5">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">

                    {/* Center */}
                    <div className="text-xs md:text-sm opacity-80">
                        Verity AI. All rights reserved. © 2026
                    </div>

                    <div className="text-xs md:text-sm hover:underline opacity-80">
                        <Link href="/feedback">Feedback</Link>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-5">
                        <a
                            href="https://www.linkedin.com/company/verity-ai"
                            target="_blank"
                            className="opacity-80 hover:opacity-100 transition"
                        >
                            <img src="/linkedin (2).png" alt="LinkedIn" className="h-5 md:h-6" />
                        </a>

                        <a
                            href="https://x.com/verity_ai"
                            target="_blank"
                            className="opacity-80 hover:opacity-100 transition"
                        >
                            <img src="/twitter (2).png" alt="X" className="h-5 md:h-6" />
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}
