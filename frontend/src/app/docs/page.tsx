"use client";

import React from "react";
import {
    BookOpen,
    FileText,
    Shield,
    Code,
    Zap,
    Globe,
    ArrowRight,
    ChevronRight,
    Search,
    Layers,
    Cpu,
    BarChart
} from "lucide-react";
import Navbar from "@/components/home/navbar";
import Footer from "@/components/home/footer";
import Link from "next/link";
import { COMMON_ROUTES, USER_ROUTES } from "@/routes";

const categories = [
    {
        title: "Getting Started",
        icon: <BookOpen className="w-6 h-6 text-blue-400" />,
        items: [
            { name: "Introduction to ChainVerse", href: "/docs/intro" },
            { name: "Creating your Account", href: USER_ROUTES.REGISTER },
            { name: "Connecting your Wallet", href: "#" },
            { name: "Ecosystem Overview", href: COMMON_ROUTES.GET_STARTED },
        ]
    },
    {
        title: "Core Infrastructure",
        icon: <Cpu className="w-6 h-6 text-purple-400" />,
        items: [
            { name: "Cross-chain Bridge", href: COMMON_ROUTES.BRIDGE },
            { name: "Smart Routing", href: COMMON_ROUTES.SWAP },
            { name: "Liquidity Protocols", href: COMMON_ROUTES.LIQUIDITY },
            { name: "Security Standards", href: "#" },
        ]
    },
    {
        title: "Governance & Community",
        icon: <Globe className="w-6 h-6 text-green-400" />,
        items: [
            { name: "DAO Structure", href: USER_ROUTES.COMMUNITY },
            { name: "Voting Mechanisms", href: "#" },
            { name: "Community Guidelines", href: "#" },
            { name: "Proposals", href: "#" },
        ]
    },
    {
        title: "For Developers",
        icon: <Code className="w-6 h-6 text-orange-400" />,
        items: [
            { name: "API Reference", href: "#" },
            { name: "SDK Documentation", href: "#" },
            { name: "Webhooks", href: "#" },
            { name: "Smart Contracts", href: "#" },
        ]
    }
];

export default function DocsPage() {
    return (
        <div className="dark min-h-screen bg-[#050505] text-white selection:bg-blue-500 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 w-full pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Hero Section */}
                    <div className="relative mb-20">
                        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="text-center relative z-10">
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                                Documentation
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                                Everything you need to know about building, trading, and growing in the ChainVerse ecosystem.
                            </p>

                            <div className="max-w-2xl mx-auto relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search documentation..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg backdrop-blur-sm"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 border border-white/5">Ctrl</span>
                                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 border border-white/5">K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((category, index) => (
                            <div key={index} className="flex flex-col gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07] group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 group-hover:scale-110 transition-all duration-300">
                                        {category.icon}
                                    </div>
                                    <h3 className="text-xl font-bold">{category.title}</h3>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {category.items.map((item, itemIdx) => (
                                        <Link
                                            key={itemIdx}
                                            href={item.href}
                                            className="flex items-center justify-between text-gray-400 hover:text-white transition-colors group/link"
                                        >
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Links / Featured Docs */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-gradient-to-br from-blue-600/20 via-transparent to-transparent border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <FileText className="w-40 h-40" />
                            </div>
                            <div className="relative z-10">
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 inline-block">Featured</span>
                                <h2 className="text-3xl font-bold mb-4">ChainVerse Whitepaper v2.0</h2>
                                <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                                    Deep dive into our architectural design, tokenomics, and the roadmap for the next decade of decentralized finance.
                                </p>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    Read Whitepaper <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group">
                            <div>
                                <h3 className="text-2xl font-bold mb-4">Resources</h3>
                                <div className="space-y-4">
                                    <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                                        <BarChart className="w-5 h-5" /> Analytics Dashboard
                                    </Link>
                                    <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                                        <Shield className="w-5 h-5" /> Audits & Security
                                    </Link>
                                    <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                                        <Layers className="w-5 h-5" /> Asset Directory
                                    </Link>
                                </div>
                            </div>
                            <Link href="#" className="mt-8 text-blue-400 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                                View all resources <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
