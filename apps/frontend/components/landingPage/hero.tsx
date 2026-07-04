"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

const highlights = [
    "Track the same query across ChatGPT, Gemini, Claude, and Google AI Overviews.",
    "See whether your brand is mentioned, how prominent it is, and how competitors are framed.",
    "Catch visibility drops, missing-brand responses, and sentiment shifts before they compound.",
    "Turn answer data into recommendations your growth, content, and brand teams can act on.",
];

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            {/* ── Background image ── */}
            <Image
                src="/hero3.jpg"
                alt="Hero background"
                fill
                priority
                className="object-cover"
            />

            {/* ── Gradient overlays ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
            {/* Bottom fade to solid black — merges with DashboardPreview */}
            {/* <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-white" /> */}

            {/* ── Content (same as original, overlaid on image) ── */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 text-center min-h-screen flex flex-col justify-center">

                <div className="grid grid-cols-1 md:grid-cols-2 mb-8">
                    <div className="inline-block md:text-right px-2 py-1 text-sm font-medium text-white/80 rounded-lg">
                        AI Search Visibility Platform
                    </div>
                    <div className="inline-block md:text-left px-2 py-1 text-sm font-medium text-white rounded-lg">
                        <span className="font-semibold bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg">
                            for brands that want clarity.
                        </span>
                    </div>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight text-white">
                    <span className="text-white/90">If AI answers shape discovery,</span>
                    <br />
                    your brand needs to be part of the answer.
                </h1>

                <p className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl text-black/80 leading-relaxed">
                    VerityAI shows how AI systems describe your brand, where competitors win, and what to improve next.
                </p>

                <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
                    {highlights.map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border-t border-white/20 shadow-sm bg-white/10 backdrop-blur-md px-4 py-3 text-sm text-black/80"
                        >
                            {item}
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl bg-white cursor-pointer px-4 py-2 font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    >
                        Start Monitoring
                    </button>

                    <button
                        onClick={() => router.push("/demo")}
                        className="rounded-xl border border-white/40 px-4 py-2 font-semibold text-white transition-all duration-300 hover:border-white/70 hover:bg-black bg-black/80"
                    >
                        See how it works
                    </button>
                </div>
            </div>
        </section>
    );
}
