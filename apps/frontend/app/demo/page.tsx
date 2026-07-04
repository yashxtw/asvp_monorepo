import DemoWizard from "@/components/demo/DemoWizard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Interactive Demo — VerityAI",
    description: "Try VerityAI to track and measure your brand's presence across ChatGPT, Gemini, Claude, and Google AI Overviews without login.",
};

export default function DemoPage() {
    return <DemoWizard />;
}
