"use client";

import React, { useState, useMemo, useEffect } from "react";
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
    BarChart,
    X,
    MessageSquare,
    Lock
} from "lucide-react";
import Navbar from "@/components/home/navbar";
import Footer from "@/components/home/footer";
import Link from "next/link";
import { DOC_CONTENT, DocItem } from "@/lib/docs/content";
// Note: Metadata moved to layout.tsx because this is a client component

const categoryIcons: Record<string, React.ReactNode> = {
    "Getting Started": <BookOpen className="w-6 h-6 text-blue-400" />,
    "Core Infrastructure": <Cpu className="w-6 h-6 text-purple-400" />,
    "Governance & Community": <Globe className="w-6 h-6 text-green-400" />,
    "For Developers": <Code className="w-6 h-6 text-orange-400" />,
    "Policies": <Shield className="w-6 h-6 text-red-400" />
};

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Grouping DOC_CONTENT by category for the main view
    const categories = useMemo(() => {
        const groups: Record<string, DocItem[]> = {};
        DOC_CONTENT.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return Object.entries(groups).map(([title, items]) => ({
            title,
            icon: categoryIcons[title] || <Layers className="w-6 h-6 text-gray-400" />,
            items
        }));
    }, []);

    // Filtered results for search
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return DOC_CONTENT.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    // Ctrl+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("docs-search-input")?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="dark min-h-screen bg-[#050505] text-white selection:bg-blue-500 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 w-full pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Hero Section */}
                    <div className="relative mb-20">
                        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="text-center relative z-10">
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                                Documentation
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                                Everything you need to know about building, trading, and growing in the ChainVerse ecosystem.
                            </p>

                            <div className="max-w-2xl mx-auto relative group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-blue-400' : 'text-gray-500'}`} />
                                <input
                                    id="docs-search-input"
                                    type="text"
                                    placeholder="Search documentation, policies, features..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg backdrop-blur-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                    <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 border border-white/5 font-mono">⌘</span>
                                    <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 border border-white/5 font-mono">K</span>
                                </div>

                                {/* Search Results Dropdown */}
                                {searchQuery && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            <div className="p-2">
                                                {searchResults.map((result) => (
                                                    <Link
                                                        key={result.id}
                                                        href={result.href}
                                                        className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors group/res"
                                                    >
                                                        <div className="p-2 rounded-lg bg-white/5 group-hover/res:bg-blue-500/20 text-gray-400 group-hover/res:text-blue-400 transition-colors">
                                                            {categoryIcons[result.category] || <FileText size={18} />}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-white group-hover/res:text-blue-400 transition-colors">
                                                                {result.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500 line-clamp-1">
                                                                {result.description}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={14} className="ml-auto text-gray-600" />
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 text-center text-gray-500">
                                                No results found for "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                            <span className="text-sm font-medium">{item.title}</span>
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Access / Featured */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-gradient-to-br from-blue-600/20 via-transparent to-transparent border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <FileText className="w-40 h-40" />
                            </div>
                            <div className="relative z-10">
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 inline-block">Featured</span>
                                <h2 className="text-3xl font-bold mb-4 italic">ChainVerse Whitepaper v3.0</h2>
                                <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                                    Deep dive into our architectural design, tokenomics, and the roadmap for the next decade of decentralized finance.
                                </p>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-400 transition-all transform active:scale-95">
                                    View Whitepaper <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group">
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Quick Links</h3>
                                <div className="space-y-6">
                                    <Link href="/user/trading" className="flex items-center gap-4 text-gray-400 hover:text-white transition-all hover:translate-x-1">
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10"><BarChart className="w-5 h-5 text-amber-500" /></div>
                                        <span className="font-medium">Trading Hub</span>
                                    </Link>
                                    <Link href="/docs/security" className="flex items-center gap-4 text-gray-400 hover:text-white transition-all hover:translate-x-1">
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/10"><Shield className="w-5 h-5 text-emerald-500" /></div>
                                        <span className="font-medium">Security Audits</span>
                                    </Link>
                                    <Link href="/user/community" className="flex items-center gap-4 text-gray-400 hover:text-white transition-all hover:translate-x-1">
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/10"><MessageSquare className="w-5 h-5 text-blue-400" /></div>
                                        <span className="font-medium">Community Forum</span>
                                    </Link>
                                </div>
                            </div>
                            <Link href="/docs/intro" className="mt-8 text-blue-400 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                                All documentation <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
