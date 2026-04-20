import Image from "next/image";

export default function BottomCTA() {
    return (
        <section className="relative px-4 pt-10 pb-20 text-[#171717]">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-black via-neutral-900 to-neutral-800 text-white shadow-2xl">
                <div className="grid items-center gap-10 p-10 md:grid-cols-2 md:p-16">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                            Build an AI visibility workflow before competitors lock in the narrative.
                        </h2>

                        <p className="mt-4 text-lg text-neutral-300">
                            VerityAI gives your team a system: monitor the answers that matter, understand why your
                            brand is weak or missing, and respond with better decisions.
                        </p>

                        <p className="mt-4 text-neutral-400">
                            If AI assistants already influence research and buying behavior in your category, this is a
                            capability worth building early.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="/signup"
                                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
                            >
                                Start with VerityAI
                            </a>

                            <a
                                href="#how-it-works"
                                className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Explore the workflow
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative h-64 w-full md:h-80">
                            <Image
                                src="/dashboard.png"
                                alt="ASVP Dashboard Preview"
                                fill
                                className="rounded-2xl object-contain"
                            />
                        </div>
                        <p className="mb-4 mt-2 text-center text-sm italic text-gray-100 opacity-30">
                            - Dashboard preview
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
