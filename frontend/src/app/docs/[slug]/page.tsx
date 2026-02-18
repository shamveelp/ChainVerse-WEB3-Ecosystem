"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DOC_CONTENT } from "@/lib/docs/content";
import Navbar from "@/components/home/navbar";
import Footer from "@/components/home/footer";
import Link from "next/link";
import {
    ChevronLeft,
    Clock,
    Tag,
    Share2,
    Printer,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function DocDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const doc = useMemo(() => {
        return DOC_CONTENT.find(item => item.id === slug || item.href.endsWith(slug));
    }, [slug]);

    if (!doc) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Document Not Found</h1>
                <Link href="/docs" className="text-blue-400 hover:underline flex items-center gap-2">
                    <ChevronLeft size={20} /> Back to Documentation
                </Link>
            </div>
        );
    }

    // Function to "parse" simple markdown-like headers
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('###')) {
                return <h3 key={i} className="text-xl font-bold mt-8 mb-4 text-white">{trimmed.replace('###', '')}</h3>;
            }
            if (trimmed.startsWith('##')) {
                return <h2 key={i} className="text-3xl font-bold mt-12 mb-6 text-white border-b border-white/10 pb-2">{trimmed.replace('##', '')}</h2>;
            }
            if (trimmed.startsWith('-')) {
                return <li key={i} className="ml-4 mb-2 text-gray-400">{trimmed.replace('-', '').trim()}</li>;
            }
            if (trimmed.match(/^\d\./)) {
                return <div key={i} className="ml-4 mb-4 font-bold text-blue-400 mt-6">{trimmed}</div>;
            }
            if (trimmed === "") return <br key={i} />;
            return <p key={i} className="text-gray-400 leading-relaxed mb-4">{trimmed}</p>;
        });
    };

    return (
        <div className="dark min-h-screen bg-[#050505] text-white selection:bg-blue-500 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 w-full pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* Sidebar Navigation */}
                    <aside className="hidden lg:block col-span-1">
                        <div className="sticky top-32 space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Documentation</h3>
                                <nav className="space-y-2">
                                    {DOC_CONTENT.filter(item => item.category === doc.category).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`block px-4 py-2 rounded-xl text-sm transition-all ${item.id === doc.id
                                                ? "bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20"
                                                : "text-gray-500 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            {item.title}
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-white/10">
                                <h4 className="text-sm font-bold mb-2">Need help?</h4>
                                <p className="text-xs text-gray-500 mb-4">Our community architects are available 24/7 on Discord.</p>
                                <button className="w-full py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-blue-400 transition-colors mb-4">
                                    JOIN DISCORD
                                </button>
                                {doc.featureHref && (
                                    <Link href={doc.featureHref}>
                                        <button className="w-full py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black rounded-lg hover:bg-blue-500/30 transition-colors">
                                            LAUNCH FEATURE
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <article className="col-span-1 lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium">
                                <Link href="/docs" className="hover:text-white">Documentation</Link>
                                <ChevronRight size={12} />
                                <span className="text-blue-400">{doc.category}</span>
                            </nav>

                            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none italic uppercase">
                                {doc.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-12 pb-8 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-blue-500" />
                                    <span>5 min read</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="text-purple-500" />
                                    <span>{doc.tags[0]}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-4">
                                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Share2 size={18} /></button>
                                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Printer size={18} /></button>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-xl text-gray-300 leading-relaxed mb-12 font-light">
                                    {doc.description}
                                </p>

                                {doc.fullContent ? renderContent(doc.fullContent) : (
                                    <div className="p-12 rounded-3xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-gray-500 italic">Extended documentation for this section is currently being architected by our AI agents. Check back soon for deeper insights.</p>
                                    </div>
                                )}
                            </div>

                            {/* Next/Prev Navigation */}
                            <div className="mt-20 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/[0.08] transition-all">
                                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">Feedback</p>
                                    <h4 className="text-lg font-bold mb-4">Was this helpful?</h4>
                                    <div className="flex gap-4">
                                        <button className="px-4 py-2 bg-white/5 rounded-xl hover:bg-blue-500/20 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/20">Yes, thanks!</button>
                                        <button className="px-4 py-2 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">Not really</button>
                                    </div>
                                </div>

                                <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-transparent border border-white/10 group cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-xs text-blue-400 mb-2 font-bold uppercase tracking-widest">Next Step</p>
                                        <h4 className="text-xl font-bold mb-6 italic">Ready to dive deeper?</h4>
                                        <Link href="/get-started">
                                            <button className="flex items-center gap-2 text-white font-bold group">
                                                Go to Ecosystem Hub <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
