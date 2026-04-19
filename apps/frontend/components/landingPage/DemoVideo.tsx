"use client";

export default function DemoSection() {
    return (
        <section className="py-10 text-[#171717]">
            <div className="max-w-7xl mx-auto grid items-center gap-20 px-6 md:grid-cols-2 md:px-20">
                <div>
                    <p className="mb-4 text-sm italic text-zinc-500">See it in action</p>

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                        Watch how a team goes from
                        <br />
                        AI blind spots to action.
                    </h2>

                    <p className="mt-6 max-w-md text-lg text-zinc-600">
                        The product flow is simple to explain and powerful in practice: pick a brand, run tracked
                        queries, compare source-specific answers, inspect alerts, and turn weak visibility into a clear
                        response plan.
                    </p>

                    <button className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
                        See the product in motion
                    </button>
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl">
                    <iframe
                        className="h-full w-full"
                        src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                        title="ASVP Demo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </section>
    );
}
