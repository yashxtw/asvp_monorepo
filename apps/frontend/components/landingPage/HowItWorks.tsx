"use client";

const steps = [
    {
        number: "01",
        title: "Set up brands and tracked queries",
        description:
            "Create the brands you care about, add category, brand, and competitor-style queries, and choose whether you want to run them on demand or on a schedule.",
        tone: "bg-white border",
    },
    {
        number: "02",
        title: "Inspect how AI systems actually respond",
        description:
            "ASVP groups the same execution across supported sources so your team can compare mentions, sentiment, prominence, and entity overlap in one place instead of guessing from scattered prompts.",
        tone: "bg-gray-100",
    },
    {
        number: "03",
        title: "Respond with alerts, analytics, and recommendations",
        description:
            "When your brand drops out of answers or competitors dominate the story, the platform helps you prioritize the issue and move into structured next steps instead of reactive scrambling.",
        tone: "bg-white border",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="pt-10 relative text-[#171717]">
            <div className="max-w-7xl mx-auto px-6 md:px-20">
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="text-[#1E3A8A]">How the</span> platform works
                    </h2>
                    <p className="mt-6 text-lg text-zinc-600">
                        The goal is simple: help your team move from AI answer uncertainty to a clear operating loop
                        you can repeat every week.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step) => (
                        <div key={step.number} className={`${step.tone} rounded-2xl p-10 transition duration-300`}>
                            <div className="mb-6 text-6xl text-[#1E3A8A] font-extrabold text-primary/20">{step.number}</div>
                            <h3 className="mb-4 text-2xl font-semibold">{step.title}</h3>
                            <p className="text-lg leading-relaxed text-zinc-600">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
