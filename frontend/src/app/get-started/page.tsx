"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Link from "next/link";
import Lenis from "lenis";
import * as THREE from "three";
import {
    Zap,
    ArrowRight,
    Rocket,
    Globe,
    MessageSquare,
    Github,
    Twitter,
    Linkedin,
    Activity,
    ShieldCheck,
    Cpu,
    Target,
    BarChart3,
    Terminal,
    Box,
    Users,
    Trophy,
    Video,
    Coins,
    Wallet,
    HelpCircle,
    Layers,
    Lock
} from "lucide-react";
import { USER_ROUTES } from "@/routes";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface SectionLink {
    label: string;
    href: string;
    icon?: React.ReactNode;
    primary?: boolean;
}

interface Section {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    details?: string[];
    stats?: string[];
    links?: SectionLink[];
    creator?: {
        name: string;
        alias: string;
        links: Record<string, string>;
    };
    icon?: React.ReactNode;
    color: number;
    modelType?: 'btc' | 'eth' | 'polygon' | 'crystal' | 'node';
}

const SECTIONS_C: Section[] = [
    {
        id: "hero",
        title: "ChainVerse",
        subtitle: "A Unified Web3 Ecosystem",
        description: "The bridge between traditional finance and the decentralized future. Designed for everyone—from blockchain veterans to newcomers—to learn, interact, and thrive in the metaverse.",
        creator: {
            name: "Shamveel P",
            alias: "Coding Aashan",
            links: {
                portfolio: "https://shamveelp.xyz",
                github: "https://github.com/shamveelp",
                linkedin: "https://www.linkedin.com/in/shamveel-p/",
                twitter: "https://x.com/Shamveel_P/",
                leetcode: "https://leetcode.com/u/shamveelp/",
                youtube: "https://www.youtube.com/@CodingAashan"
            }
        },
        color: 0x3b82f6,
        modelType: 'crystal'
    },
    {
        id: "basics",
        title: "The Web3 Era",
        subtitle: "Knowledge is Power",
        description: "Welcome to the evolution of the internet. Web3 is built on individual sovereignty—owning your data, assets, and identity. No central middleman, just code and community.",
        details: [
            "Blockchain: An immutable digital ledger.",
            "Decentralization: Power to the users.",
            "Smart Contracts: Trust via code.",
            "Ownership: You hold keys."
        ],
        links: [
            { label: "Web3 101 Guide", href: "#", icon: <HelpCircle size={14} /> },
            { label: "Platform Purpose", href: "#" }
        ],
        icon: <Layers className="w-10 h-10 text-white" />,
        color: 0xffffff,
        modelType: 'node'
    },
    {
        id: "market",
        title: "Real-Time Markets",
        subtitle: "Data-Driven Decisions",
        description: "Experience institutional financial data. Deep-liquidity graphs with real-time TradingView components. Monitor Bitcoin and Ethereum with sub-second accuracy.",
        details: [
            "TradingView Visuals",
            "Whale Alert Tracking",
            "Live Sentiment Heatmaps",
            "Direct Market Access"
        ],
        stats: ["BTC $70k+", "ETH $3k+", "Polygon Hub"],
        links: [
            { label: "Trading Hub", href: USER_ROUTES.MARKET, primary: true },
            { label: "Live Graphs", href: "#" }
        ],
        icon: <BarChart3 className="w-10 h-10 text-amber-500" />,
        color: 0xf59e0b,
        modelType: 'btc'
    },
    {
        id: "dex",
        title: "DEX Node Matrix",
        subtitle: "Efficient Liquidity Layer",
        description: "Swap native CoinA & CoinB assets instantly. AI-optimized routing ensures top prices. Buy Sepolia testnet assets via Razorpay—recieved within 48 hours validation.",
        details: [
            "AI Agent Swap Assistant",
            "Yield & Liquidity Rewards",
            "Sepolia Payouts (48h)",
            "Fiat-to-Crypto Support"
        ],
        links: [
            { label: "Launch Matrix", href: USER_ROUTES.TRADING, primary: true },
            { label: "Sepolia Faucet", href: "https://sepoliafaucet.com/" }
        ],
        icon: <Zap className="w-10 h-10 text-cyan-400" />,
        color: 0x22d3ee,
        modelType: 'eth'
    },
    {
        id: "wallet",
        title: "Wallet Guardian",
        subtitle: "The Future of Connection",
        description: "Connect via Thirdweb SDK. We've integrated Google/Facebook social logins and Biometric Passkeys—unlock your wallet with your fingerprint or face unlock.",
        details: [
            "Biometric Passkey (Face/TouchID)",
            "Google & Facebook Connect",
            "Mobile App Deep-Links",
            "Non-Custodial Security"
        ],
        links: [
            { label: "Security Audit", href: "#", icon: <Lock size={14} /> },
            { label: "Wallet Guide", href: "#" }
        ],
        icon: <Wallet className="w-10 h-10 text-emerald-400" />,
        color: 0x10b981,
        modelType: 'polygon'
    },
    {
        id: "nft",
        title: "The NFT Forge",
        subtitle: "Digital Assets Presence",
        description: "A digital bazaar where ownership is absolute. Solidity smart contracts for transactions and IPFS for permanent storage. Convex DB protection for governance.",
        details: [
            "Solidity Minting & Royalties",
            "IPFS: Decentralized Storage",
            "Convex DB: Rule Enforcement",
            "Admin Analysis: Protection"
        ],
        links: [
            { label: "NFT Marketplace", href: USER_ROUTES.NFT_MARKET, primary: true },
            { label: "Mint Guide", href: "#" }
        ],
        icon: <Box className="w-10 h-10 text-fuchsia-400" />,
        color: 0xd946ef,
        modelType: 'crystal'
    },
    {
        id: "rewards",
        title: "Rewards Node",
        subtitle: "Proof of Loyalty",
        description: "Engagement quantized into value. Check-in daily for 10 points. Refer colleagues for 100 bonus points. Convert 100pts to 1 $CV token instantly to your wallet.",
        details: [
            "Daily Check-in: +10 Points",
            "Referral Hub: +100 Points",
            "100 pts => 1 $CV Token",
            "Claim to Wallet Payouts"
        ],
        stats: ["Points Hub", "Daily Streaks"],
        links: [
            { label: "My Rewards", href: USER_ROUTES.PROFILE, primary: true }
        ],
        icon: <Coins className="w-10 h-10 text-yellow-500" />,
        color: 0xeab308,
        modelType: 'crystal'
    },
    {
        id: "social",
        title: "Community Social",
        subtitle: "Decentralized Nexus",
        description: "Communication specialized for ChainVerse. Algorithmically optimized feeds, real-time Socket.io chatting, and early access to DAO membership voting.",
        details: [
            "Twitter-style Feeds",
            "Socket.io: Instant P2P Chat",
            "Nested Comments & Sharing",
            "DAO Hub & Early Access"
        ],
        links: [
            { label: "Join Nexus", href: USER_ROUTES.COMMUNITY, primary: true }
        ],
        icon: <MessageSquare className="w-10 h-10 text-blue-400" />,
        color: 0x60a5fa,
        modelType: 'node'
    },
    {
        id: "admin",
        title: "Admin Matrix",
        subtitle: "Build Your Sovereignty",
        description: "Verified community architects. Apply for moderation, manage members, and get the Blue Tick. Exclusive access to premium ChainCast and AI Quest tools.",
        details: [
            "Community Creation: 48hr Wait",
            "Blue Verification Status",
            "Admin Control Panel",
            "Premium Reach Analytics"
        ],
        links: [
            { label: "Onboard Admin", href: "/admin/onboarding", primary: true }
        ],
        icon: <Trophy className="w-10 h-10 text-purple-400" />,
        color: 0xa855f7,
        modelType: 'node'
    },
    {
        id: "chaincast",
        title: "ChainCast Quests",
        subtitle: "High-Utility Toolkit",
        description: "Host live video call sessions with real-time reactions. Architect Quests using LangChain-powered Agent 'CAT' with Random, FCFS, or Leaderboard rewards.",
        details: [
            "Live Multi-User Video & Chat",
            "Agentic AI (CAT): Design",
            "Selection: Random, FCFS",
            "Reward Settlement: Auto"
        ],
        icon: <Video className="w-10 h-10 text-red-500" />,
        color: 0xef4444,
        modelType: 'crystal'
    }
];

export default function GetStartedPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const sections = useMemo(() => SECTIONS_C, []);

    useGSAP(() => {
        const lenis = new Lenis({
            autoRaf: true,
            duration: 1.5,
            lerp: 0.1,
            touchMultiplier: 1.5
        });
        lenis.on('scroll', ScrollTrigger.update);

        // --- SCALE REDUCED ENGINE ---
        const isMobile = window.innerWidth < 768;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current!,
            antialias: !isMobile,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        // Optimized Background Galaxy
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = isMobile ? 1200 : 3000;
        const posArray = new Float32Array(particlesCount * 3);
        const colArray = new Float32Array(particlesCount * 3);
        const colorPool = [new THREE.Color(0x3b82f6), new THREE.Color(0x8b5cf6), new THREE.Color(0x22d3ee)];

        for (let i = 0; i < particlesCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 150;
            posArray[i + 1] = (Math.random() - 0.5) * 150;
            posArray[i + 2] = (Math.random() - 0.5) * 400;
            const color = colorPool[Math.floor(Math.random() * colorPool.length)];
            colArray[i] = color.r; colArray[i + 1] = color.g; colArray[i + 2] = color.b;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
        const particlesMesh = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.5 }));
        scene.add(particlesMesh);

        // Centered Object Creators - REDUCED SIZE
        const createCoin = (color: number) => {
            const group = new THREE.Group();
            const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 32), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, metalness: 1, roughness: 0.2 }));
            coin.rotation.x = Math.PI / 2;
            group.add(coin);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 16, 100), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
            ring.position.z = 0.13;
            group.add(ring);
            return group;
        };
        const createCrystal = (color: number) => {
            const group = new THREE.Group();
            group.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshPhongMaterial({ color, wireframe: true, transparent: true, opacity: 0.2 })));
            group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5 })));
            return group;
        };

        const nodes: THREE.Group[] = [];
        sections.forEach((section, i) => {
            let node;
            if (['btc', 'eth', 'polygon'].includes(section.modelType || '')) node = createCoin(section.color);
            else node = createCrystal(section.color);

            node.position.set(0, 0, -40 * i);
            scene.add(node);
            nodes.push(node);
        });

        const pLight = new THREE.PointLight(0xffffff, 80, 300);
        pLight.position.set(0, 5, 10);
        scene.add(pLight);
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        camera.position.z = 10;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: () => `+=${sections.length * 400}%`,
                scrub: 1,
                pin: true,
                onUpdate: (self) => {
                    const progress = self.progress * sections.length;
                    setActiveIdx(Math.min(Math.floor(progress + 0.2), sections.length - 1));
                }
            }
        });

        tl.to(camera.position, {
            z: -40 * (sections.length - 1) - 5,
            ease: "none"
        }, 0);

        const animate = () => {
            particlesMesh.rotation.y += 0.0002;
            nodes.forEach((node, i) => {
                node.rotation.y += 0.008;
                node.position.y = Math.sin(Date.now() * 0.001 + i) * 0.3;
            });
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        const animId = requestAnimationFrame(animate);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
            lenis.destroy();
        };

    }, { scope: containerRef });

    return (
        <div className="relative w-full min-h-screen bg-[#010103] text-white overflow-hidden font-outfit" ref={containerRef}>
            <canvas ref={canvasRef} className="fixed inset-0 z-0" />

            <div className="fixed inset-0 z-[5] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_2px]" />

            {/* UI OVERLAY - REDUCED SIZING */}
            <div className="relative z-20 w-full h-screen">
                {sections.map((section, idx) => (
                    <div
                        key={section.id}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 px-6 ${activeIdx === idx ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
                            }`}
                    >
                        <div className={`max-w-2xl w-full flex flex-col items-center text-center gap-6 md:gap-8 transition-all duration-1000 ${activeIdx === idx ? "translate-y-0 scale-100" : "translate-y-10 scale-98"
                            }`}>

                            {/* Header - REDUCED SIZE */}
                            <div className="space-y-3">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-0.5 w-10 bg-blue-500/50" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-500/80">Node 0{idx + 1}</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-[6rem] font-black italic tracking-tighter leading-none uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                    {section.title}
                                </h1>
                                {section.subtitle && (
                                    <p className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-[0.5em] mt-3">{section.subtitle}</p>
                                )}
                            </div>

                            {/* Content Panel - REDUCED SIZE */}
                            <div className="w-full bg-white/[0.02] backdrop-blur-[30px] border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                                <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed mb-6 md:mb-8 max-w-xl mx-auto">
                                    {section.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-8 md:mb-10 max-w-2xl mx-auto text-left">
                                    {section.details?.map((detail, d) => (
                                        <div key={d} className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,1)]" />
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">{detail}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Hub - REDUCED SIZE */}
                                <div className="flex flex-wrap justify-center gap-4">
                                    {section.links?.map((link, l) => (
                                        <Link key={l} href={link.href} target={link.href.startsWith('http') ? "_blank" : "_self"}>
                                            <button className={`group px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 ${link.primary
                                                    ? "bg-white text-black hover:bg-blue-400"
                                                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                                }`}>
                                                {link.label} {link.icon || <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />}
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Hero Creator Signoff - REDUCED SIZE */}
                            {idx === 0 && (
                                <div className="flex flex-col items-center gap-4 pt-4">
                                    <div className="w-px h-10 bg-gradient-to-b from-blue-500/30 to-transparent" />
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 pr-8 rounded-full backdrop-blur-3xl group">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                            <Image
                                                src="/8cc93015e0da9790892476d9938d5849.jpg"
                                                alt="Shamveel"
                                                fill
                                                className="object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/pixel-art/svg?seed=Shamveel" }}
                                            />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Architect</p>
                                            <h3 className="text-xs font-bold text-white leading-none">{section.creator?.name}</h3>
                                        </div>
                                        <div className="flex gap-3 border-l border-white/10 pl-4 ml-1">
                                            <Link href={section.creator?.links.github || "#"}><Github size={14} className="text-gray-500 hover:text-white" /></Link>
                                            <Link href={section.creator?.links.twitter || "#"}><Twitter size={14} className="text-gray-500 hover:text-white" /></Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analytics HUD (Visible on non-hero) - REDUCED SIZE */}
                            {idx > 0 && section.stats && (
                                <div className="flex gap-6 items-center bg-black/40 backdrop-blur-2xl border border-white/5 px-8 py-3 rounded-full">
                                    {section.stats.map((stat, s) => (
                                        <div key={s} className="flex flex-col items-center border-r last:border-0 border-white/10 pr-6 last:pr-0">
                                            <span className="text-sm font-black italic">{stat.split(' ')[0]}</span>
                                            <span className="text-[7px] text-blue-500/60 font-black uppercase tracking-widest leading-none">{stat.split(' ').slice(1).join(' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* NAVIGATION HUD - REDUCED SIZE */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-8 bg-black/80 backdrop-blur-3xl border border-white/10 px-8 py-3 rounded-full shadow-3xl">
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase">Node</span>
                    <div className="flex gap-2">
                        {sections.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${activeIdx === i ? 'bg-blue-400 scale-125' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                    <Target size={12} className="text-blue-500" />
                    <span className="text-[8px] font-black tracking-[0.3em] text-blue-500 uppercase">Synced</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="text-[12px] font-bold italic tracking-tighter">
                    -{activeIdx * 35}k <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest ml-1">Dp</span>
                </div>
            </div>

            <style jsx global>{`
                .font-outfit { font-family: 'Outfit', sans-serif; }
                canvas { filter: brightness(0.7); }
            `}</style>
        </div>
    );
}
