"use client";

import { useEffect, useState } from "react";
import DemoHeader from "./DemoHeader";
import DemoLimitReached from "./DemoLimitReached";
import DemoStepBrand from "./DemoStepBrand";
import DemoStepQueries from "./DemoStepQueries";
import DemoStepRun from "./DemoStepRun";
import DemoStepResults from "./DemoStepResults";
import DemoStepAnalytics from "./DemoStepAnalytics";
import DemoStepLocked from "./DemoStepLocked";

const TOTAL_STEPS = 6;

export default function DemoWizard() {
    const [step, setStep] = useState(1);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [brandId, setBrandId] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");
    const [queries, setQueries] = useState<any[]>([]);
    
    const [limitReached, setLimitReached] = useState(false);
    const [checkingLimit, setCheckingLimit] = useState(true);

    // Initial client-side check of localStorage
    useEffect(() => {
        const count = localStorage.getItem("verity_demo_count");
        if (count && parseInt(count, 10) >= 10) {
            setLimitReached(true);
        }
        setCheckingLimit(false);
    }, []);

    const handleBrandComplete = (newSessionId: string, newBrandId: string, newBrandName: string) => {
        setSessionId(newSessionId);
        setBrandId(newBrandId);
        setBrandName(newBrandName);
        setStep(2);
    };

    const handleQueriesComplete = (createdQueries: any[]) => {
        setQueries(createdQueries);
        setStep(3);
    };

    const handleRunComplete = () => {
        // Increment demo count in localStorage
        try {
            const currentCount = localStorage.getItem("verity_demo_count");
            const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
            localStorage.setItem("verity_demo_count", newCount.toString());
        } catch (e) {
            console.error("Failed to update demo count in localStorage:", e);
        }
        setStep(4);
    };

    if (checkingLimit) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
        );
    }

    if (limitReached) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white">
                <DemoHeader currentStep={1} totalSteps={TOTAL_STEPS} />
                <DemoLimitReached />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            <DemoHeader currentStep={step} totalSteps={TOTAL_STEPS} />
            
            <main className="flex-1 flex items-center justify-center py-10">
                {step === 1 && (
                    <DemoStepBrand onComplete={handleBrandComplete} />
                )}

                {step === 2 && sessionId && brandId && (
                    <DemoStepQueries
                        sessionId={sessionId}
                        brandId={brandId}
                        brandName={brandName}
                        onComplete={handleQueriesComplete}
                        onBack={() => setStep(1)}
                    />
                )}

                {step === 3 && sessionId && (
                    <DemoStepRun
                        sessionId={sessionId}
                        queries={queries}
                        onComplete={handleRunComplete}
                    />
                )}

                {step === 4 && sessionId && (
                    <DemoStepResults
                        sessionId={sessionId}
                        onNext={() => setStep(5)}
                    />
                )}

                {step === 5 && sessionId && (
                    <DemoStepAnalytics
                        sessionId={sessionId}
                        onNext={() => setStep(6)}
                    />
                )}

                {step === 6 && (
                    <DemoStepLocked />
                )}
            </main>
        </div>
    );
}
