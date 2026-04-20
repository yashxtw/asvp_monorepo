"use client";

import Image from "next/image";

const reviews = [
    {
        name: "Aarav",
        username: "Growth lead",
        body: "We stopped treating AI visibility like a vague future trend. VerityAI showed us exactly where our brand was missing and which competitor narratives were winning.",
        img: "/user.png",
    },
    {
        name: "Maya",
        username: "Content strategist",
        body: "The recommendation flow was the unlock. Instead of just charts, we got evidence-backed direction on what kind of content and positioning work to prioritize.",
        img: "/user.png",
    },
    {
        name: "Rohan",
        username: "Founder",
        body: "The source-by-source comparison changed our approach immediately. One model mentioned us, another ignored us, and that told us where the messaging gap really was.",
        img: "/user.png",
    },
    {
        name: "Nina",
        username: "Brand operator",
        body: "Alerts helped us catch a visibility drop before it turned into a recurring problem. That alone made the product feel operationally useful.",
        img: "/user.png",
    },
];

function ReviewCard({ img, name, username, body }: any) {
    return (
        <div className="mx-4 w-72 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="flex items-center gap-3">
                <Image src={img} alt={name} width={36} height={36} className="rounded-full" />
                <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-zinc-500">{username}</p>
                </div>
            </div>
            <p className="mt-4 text-sm text-zinc-600">{body}</p>
        </div>
    );
}

export default function Testimonials() {
    return (
        <section className="max-w-7xl mx-auto px-6 pt-10 text-[#171717] md:px-20">
            <div className="mb-16 text-center">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Teams building an edge <span className="text-[#1E3A8A]">in AI search with</span> VerityAI.
                </h2>
                <p className="mt-6 text-lg text-zinc-600">
                    The teams that start measuring AI answer visibility early usually make faster content decisions,
                    spot competitive threats sooner, and build internal confidence around what to improve next.
                </p>
            </div>

            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-linear-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-linear-to-l from-white to-transparent" />

                <div className="space-y-5 py-5">
                    <div className="flex w-max animate-scroll-left">
                        {[...reviews, ...reviews].map((review, i) => (
                            <ReviewCard key={`left-${i}`} {...review} />
                        ))}
                    </div>

                    <div className="flex w-max animate-scroll-right">
                        {[...reviews, ...reviews].map((review, i) => (
                            <ReviewCard key={`right-${i}`} {...review} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
