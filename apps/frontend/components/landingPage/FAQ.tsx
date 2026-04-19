import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./accordion";

export default function FAQ() {
    return (
        <section className="py-10 text-[#171717]">
            <div className="max-w-7xl mx-auto grid items-start gap-20 px-6 md:grid-cols-2 md:px-20">
                <div>
                    <p className="mb-4 text-sm italic text-gray-600">Got questions?</p>

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                        <span className="text-[#1E3A8A]">Frequently asked</span> questions.
                    </h2>

                    <p className="mt-6 max-w-md text-lg text-zinc-600">
                        These are the questions teams usually ask when they are trying to understand whether AI
                        visibility should become part of their operating model.
                    </p>

                    <button className="mt-8 rounded-full cursor-pointer bg-black px-6 py-3 text-sm font-medium text-white shadow-md transition hover:shadow-lg">
                        Contact Us
                    </button>
                </div>

                <div>
                    <Accordion type="single" collapsible className="w-full divide-y divide-zinc-200">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                What is ASVP?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                ASVP is an AI Search Visibility Platform that helps brands understand how AI systems
                                describe them, whether they are mentioned, which competitors are favored, and what
                                actions should improve their inclusion in future answers.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                How is this different from traditional SEO tooling?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                Traditional SEO tools focus on search rankings and SERPs. ASVP focuses on AI answer
                                behavior: mention presence, prominence, sentiment, competitor overlap, source-by-source
                                differences, and recommendation workflows built around those signals.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                Which AI systems does the platform monitor?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                The current workflow is designed around ChatGPT, Gemini, Claude, and Google AI
                                Overviews so the same query can be analyzed across multiple high-impact sources.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                What can my team actually do inside the platform?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                Teams can manage brands, create and schedule queries, inspect grouped executions, track
                                visibility and sentiment trends, compare sources, review alerts, and work from
                                recommendations that explain what to improve next.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                Does it only show data, or does it help us act on it?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                It helps you act. The platform is moving beyond passive reporting by turning answer
                                evidence into recommendations, content direction, and suggested next steps that teams
                                can operationalize.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-6">
                            <AccordionTrigger className="py-6 text-left text-lg font-medium">
                                Can I cancel anytime?
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 leading-relaxed text-zinc-600">
                                Yes. You can cancel anytime from your dashboard. The goal is to make the product
                                valuable enough to stay in your workflow because it helps, not because you are trapped.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
