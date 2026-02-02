"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
    Zap,
    Repeat,
    Droplets,
    CreditCard,
    Image as ImageIcon,
    Users,
    Trophy,
    Rocket,
    ArrowRight,
    Sparkles,
    Shield,
    Layers
} from "lucide-react";

// Register ScrollTrigger
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const steps = [
    {
        id: "intro",
        title: "Welcome to ChainVerse",
        description: "ChainVerse is a revolutionary Web3 ecosystem designed to bridge the gap between traditional finance and the decentralized future. We provide a seamless, secure, and intuitive platform for all your blockchain needs.",
        icon: <Rocket className="w-8 h-8 text-blue-400" />,
        color: "from-blue-500 to-cyan-400",
        side: "left"
    },
    {
        id: "trade",
        title: "Advanced Trading",
        description: "Experience institutional-grade trading tools at your fingertips. Our decentralized exchange offers deep liquidity, low latency, and a wide variety of order types for professional traders.",
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
        color: "from-yellow-500 to-orange-400",
        side: "right"
    },
    {
        id: "swap",
        title: "Instant Swaps",
        description: "Exchange tokens across multiple chains instantly. Our smart router finds the best prices and lowest slippage, ensuring you get the most value for every trade.",
        icon: <Repeat className="w-8 h-8 text-green-400" />,
        color: "from-green-500 to-emerald-400",
        side: "left"
    },
    {
        id: "liquidity",
        title: "Liquidity Provision",
        description: "Put your assets to work. Provide liquidity to our pools and earn a share of trading fees. Our automated market maker ensures efficient price discovery and steady rewards.",
        icon: <Droplets className="w-8 h-8 text-indigo-400" />,
        color: "from-indigo-500 to-purple-400",
        side: "right"
    },
    {
        id: "buy",
        title: "Buy Crypto",
        description: "Easily transition from fiat to crypto. Support for credit cards, bank transfers, and local payment methods makes entering the Web3 space simpler than ever.",
        icon: <CreditCard className="w-8 h-8 text-pink-400" />,
        color: "from-pink-500 to-rose-400",
        side: "left"
    },
    {
        id: "nft",
        title: "NFT Marketplace",
        description: "Discover, collect, and trade unique digital assets. Our marketplace supports creators and collectors with low fees and high-performance browsing.",
        icon: <ImageIcon className="w-8 h-8 text-purple-400" />,
        color: "from-purple-500 to-fuchsia-400",
        side: "right"
    },
    {
        id: "community",
        title: "Community & DAO",
        description: "Be part of the governance. Join our community-led DAO to vote on proposals, participate in discussions, and shape the future of ChainVerse.",
        icon: <Users className="w-8 h-8 text-cyan-400" />,
        color: "from-cyan-500 to-blue-400",
        side: "left"
    },
    {
        id: "quests",
        title: "Quest System",
        description: "Learn and earn through gamified challenges. Complete quests, gain experience, and unlock exclusive rewards as you explore the ecosystem.",
        icon: <Trophy className="w-8 h-8 text-amber-400" />,
        color: "from-amber-500 to-yellow-400",
        side: "right"
    }
];

export default function GetStartedPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    useGSAP(() => {
        // Path drawing animation
        if (pathRef.current) {
            const path = pathRef.current;
            const length = path.getTotalLength();

            // Initial state
            gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length
            });

            // Animate path on scroll
            gsap.to(path, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 20%",
                    end: "bottom 80%",
                    scrub: 1,
                }
            });
        }

        // Step animations
        steps.forEach((step, index) => {
            gsap.from(`.step-card-${index}`, {
                x: step.side === "left" ? -100 : 100,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: `.step-container-${index}`,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            });

            gsap.from(`.step-dot-${index}`, {
                scale: 0,
                duration: 0.5,
                ease: "back.out(2)",
                scrollTrigger: {
                    trigger: `.step-container-${index}`,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            });

            gsap.from(`.step-connector-${index}`, {
                width: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: `.step-container-${index}`,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            });
        });
    }, { scope: containerRef });

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden font-outfit" ref={containerRef}>
            {/* Hero Background Elements */}
            <div className="absolute top-0 left-0 w-full h-screen overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-32">
                {/* Header Section */}
                <div className="text-center mb-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-100 uppercase tracking-widest">The Journey Starts Here</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
                        How to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Get Started</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Your comprehensive guide to navigating the ChainVerse ecosystem.
                        Follow the flow to unlock the full potential of decentralized finance.
                    </p>
                </div>

                {/* Flowchart Section */}
                <div className="relative mt-20">
                    {/* Vertical Line Path (Desktop) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 hidden md:block">
                        <svg
                            className="h-full w-full"
                            viewBox="0 0 100 1000"
                            preserveAspectRatio="none"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M50 0 L50 1000"
                                stroke="white"
                                strokeOpacity="0.05"
                                strokeWidth="4"
                            />
                            <path
                                ref={pathRef}
                                d="M50 0 L50 1000"
                                stroke="url(#gradient-path)"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient-path" x1="0" y1="0" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#60A5FA" />
                                    <stop offset="50%" stopColor="#A855F7" />
                                    <stop offset="100%" stopColor="#EC4899" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Steps */}
                    <div className="space-y-40 relative">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`step-container-${index} flex flex-col md:flex-row items-center justify-center relative w-full`}
                            >
                                {/* Desktop Layout */}
                                <div className={`hidden md:flex w-full items-center ${step.side === "left" ? "flex-row-reverse" : "flex-row"}`}>
                                    {/* Content Card Side */}
                                    <div className={`w-1/2 flex ${step.side === "left" ? "justify-end pr-16" : "justify-start pl-16"}`}>
                                        <div className={`step-card-${index} group relative w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
                                            <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-500`} />

                                            <div className="flex items-start gap-4 mb-6">
                                                <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-black/20`}>
                                                    {step.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-300 transition-colors">{step.title}</h3>
                                                    <div className={`h-1 w-12 bg-gradient-to-r ${step.color} rounded-full`} />
                                                </div>
                                            </div>

                                            <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                                                {step.description}
                                            </p>

                                            <button className="flex items-center gap-2 text-sm font-semibold text-blue-400 group/btn hover:text-blue-300 transition-colors">
                                                Explore Feature <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Center Dot and Connector */}
                                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                                        <div className={`step-connector-${index} absolute h-[2px] bg-gradient-to-r ${step.side === "left" ? "from-transparent to-white/20" : "from-white/20 to-transparent"} ${step.side === "left" ? "right-full -right-2 w-32 translate-x-1" : "left-full -left-2 w-32 -translate-x-1"}`} />
                                        <div className={`step-dot-${index} relative z-20 w-8 h-8 rounded-full bg-[#0a0a0f] border-4 border-white/20 flex items-center justify-center overflow-hidden`}>
                                            <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-20`} />
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.color} shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                                        </div>
                                    </div>

                                    {/* Spacer for the other side */}
                                    <div className="w-1/2" />
                                </div>

                                {/* Mobile Layout */}
                                <div className="flex md:hidden flex-col items-center w-full px-4">
                                    <div className={`step-dot-${index} w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6`}>
                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${step.color}`} />
                                    </div>

                                    <div className={`step-card-${index} w-full p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} bg-opacity-20`}>
                                                <div className="w-6 h-6 flex items-center justify-center">
                                                    {step.icon}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold">{step.title}</h3>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                            {step.description}
                                        </p>
                                        <button className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                                            Explore Feature <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Vertical Line for Mobile */}
                                    {index !== steps.length - 1 && (
                                        <div className="w-[2px] h-20 bg-gradient-to-b from-white/10 to-transparent mt-6 mb-[-1.5rem]" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-40 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

                    <div className="relative z-10 p-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to dive in?</h2>
                        <p className="text-gray-400 mb-10 max-w-xl mx-auto">
                            Join thousands of users who are already building the future of finance on ChainVerse.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                Launch App <Zap className="w-4 h-4 fill-black" />
                            </button>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-full hover:bg-white/10 transition-colors">
                                Read Documentation
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Decorative Floating Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/4 left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] border-[1px] border-white/[0.02] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] border-[1px] border-white/[0.02] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] border-[1px] border-white/[0.02] rounded-full" />
            </div>
        </div>
    );
}
