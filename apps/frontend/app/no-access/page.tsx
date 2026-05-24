"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function NoAccessPage() {
    const [slots, setSlots] = useState<number | null>(null);
    const [isFull, setIsFull] = useState(false);

    useEffect(() => {
        fetch("/api/no-access/slots")
            .then((res) => res.json())
            .then((data) => {
                setSlots(data.remainingSlots);
                setIsFull(data.isFull);
            });
    }, []);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });
    const [resultMessage, setResultMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setResultMessage("");

        try {
            const response = await fetch("/api/no-access/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setResultMessage(data.error || "Something went wrong.");
                setMessageType("error");
            } else {
                setResultMessage("🎉 Request sent! Check your email.");
                setMessageType("success");
                setFormData({ name: "", email: "" });
            }
        } catch {
            setResultMessage("⚠️ Network error. Try again.");
            setMessageType("error");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <main className="min-h-screen flex bg-white text-[#171717] items-center justify-center p-4">
            <div className="w-full max-w-md p-8 text-center space-y-6">
                <div className="space-y-2">
                    <div className="flex flex-col items-center space-y-3">
                        <Image
                            src="/logo_black.png"
                            alt="VerityAI Logo"
                            width={40}
                            height={40}
                            className="h-10 w-10"
                        />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Invite-only Access
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        We are currently onboarding a limited number of early users.
                    </p>
                </div>

                <div className="relative rounded-xl bg-[#F5F5F4] p-4 text-sm text-gray-600">
                    <div
                        className={`absolute -top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${isFull
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                            }`}
                    >
                        {slots === null
                            ? "Checking..."
                            : isFull
                                ? "No slots available"
                                : `${slots} Slots Available`}
                    </div>

                    <p>
                        <span className="font-medium text-gray-800">VerityAI</span> is in private beta.
                    </p>


                    <p className="mt-1">
                        We are allowing only{" "}
                        <span className="font-semibold text-gray-800">
                            10 customers
                        </span>{" "}
                        during this phase.
                    </p>


                </div>

                <form className="space-y-4 text-left" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Your name"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Work Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="you@company.com"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition cursor-pointer hover:bg-gray-900"
                    >
                        {isLoading ? "Submitting..." : "Request Access"}
                    </button>
                </form>

                {resultMessage && (
                    <p
                        className={`mt-3 text-sm font-medium text-center ${messageType === "success"
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                    >
                        {resultMessage}
                    </p>
                )}


                <p className="text-xs text-gray-400">
                    We’ll review your request and get back to you if a slot opens up.
                    No spam, promise.
                </p>
            </div>
        </main>
    );
}
