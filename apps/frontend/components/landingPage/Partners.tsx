// "use client";

// import Image from "next/image";

// const logos = [
//     "/logo_black.png",
// ];

// export default function PartnersSection() {
//     return (
//         <section className="w-full text-[#171717] py-10 overflow-hidden">
//             <div className="max-w-7xl mx-auto text-center">
//                 <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
//                     Delivering <span className="text-[#1E3A8A]">results</span> for
//                 </h2>

//                 <div className="relative overflow-hidden py-10">
//                     <div
//                         className="flex w-max whitespace-nowrap"
//                         style={{
//                             animation: "scroll-left 20s linear infinite",
//                         }}
//                     >
//                         {[...logos, ...logos].map((logo, i) => (
//                             <div key={i} className="mx-12 flex items-center">
//                                 <Image
//                                     src={logo}
//                                     alt="partner logo"
//                                     width={120}
//                                     height={40}
//                                     className="h-20 w-auto object-contain opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0"
//                                 />
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Inline keyframes */}
//             <style jsx>{`
//                 @keyframes scroll-left {
//                     0% {
//                         transform: translateX(0%);
//                     }
//                     100% {
//                         transform: translateX(-50%);
//                     }
//                 }
//             `}</style>
//         </section>
//     );
// }





"use client";

import Image from "next/image";

const reviews = [
    {
        name: "VerityAI",
        img: "https://verityai-frontend.vercel.app/favicon.ico",
    },
    {
        name: "###",
        img: "",
    },
    {
        name: "###",
        img: "",
    },
    {
        name: "Kartavya Technologies",
        img: "/kartavya.png",
    },
];

function ReviewCard({ img, name, username, body }: any) {
    return (
        <div className="mx-4 w-48 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
            <div className="flex items-center gap-3">
                <Image src={img} alt={name} width={36} height={36} className="rounded-md" />
                <div>
                    <p className="text-sm font-semibold">{name}</p>
                </div>
            </div>
        </div>
    );
}

export default function PartnersSection() {
    return (
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-10 text-[#171717] md:px-20">
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Delivering <span className="text-[#1E3A8A]">results</span> for
                </h2>
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
                </div>
            </div>
        </section>
    );
}
