"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "../ui/magic/interactive-grid-pattern";

const highlights = [
    "Track the same query across ChatGPT, Gemini, Claude, and Google AI Overviews.",
    "See whether your brand is mentioned, how prominent it is, and how competitors are framed.",
    "Catch visibility drops, missing-brand responses, and sentiment shifts before they compound.",
    "Turn answer data into recommendations your growth, content, and brand teams can act on.",
];

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative overflow-hidden text-[#171717]">
            <InteractiveGridPattern
                className={cn(
                    "mask-[radial-gradient(400px_circle_at_center,white,transparent)]",
                    "inset-x-0 inset-y-[-30%] h-[130%] skew-y-12 -z-10"
                )}
            />

            <div className="max-w-6xl mx-auto px-6 z-10 pt-28 pb-10 text-center">
                {/* <div className="inline-block mb-6 px-4 py-2 text-sm font-medium text-black rounded-lg">
                    AI Search Visibility Platform <span className="font-semibold bg-[#1E3A8A] text-white px-2 py-1 rounded-lg">for brands that want clarity</span>
                </div> */}


                <div className="grid grid-cols-1 md:grid-cols-2 mb-8">
                    <div className="inline-block md:text-right px-2 py-1 text-sm font-medium text-black rounded-lg">
                        AI Search Visibility Platform
                    </div>
                    <div className="inline-block md:text-left px-2 py-1 text-sm font-medium text-black rounded-lg">
                        <span className="font-semibold bg-[#1E3A8A] text-white px-2 py-1 rounded-lg">
                            for brands that want clarity.
                        </span>
                    </div>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
                    <span className="text-[#1E3A8A]">If AI answers shape discovery,</span>
                    <br />
                    your brand needs to be part of the answer.
                </h1>

                <p className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl text-zinc-700 leading-relaxed">
                    VerityAI shows how AI systems describe your brand, where competitors win, and what to improve next.
                </p>

                <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
                    {highlights.map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border-t border-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/20 bg-white/85 px-4 py-3 text-sm text-zinc-700 "
                        >
                            {item}
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl bg-black cursor-pointer px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                    >
                        Start Monitoring
                    </button>

                    <button
                        onClick={() =>
                            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="rounded-xl border border-zinc-400 px-4 py-2 font-semibold transition-all duration-300 hover:border-zinc-600"
                    >
                        See how it works
                    </button>
                </div>
            </div>
        </section>
    );
}
