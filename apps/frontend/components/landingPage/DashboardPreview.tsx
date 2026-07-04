"use client";

import Image from "next/image";

export default function DashboardPreview() {
    return (
        <section className="relative bg-white px-4 py-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
                <div className="overflow-hidden">
                    <Image
                        src="/dashboard_with_laptop_light.png"
                        alt="VerityAI Dashboard Preview"
                        width={1920}
                        height={1080}
                        className="h-auto w-full object-cover"
                    />
                </div>
            </div>
        </section>
    );
}
