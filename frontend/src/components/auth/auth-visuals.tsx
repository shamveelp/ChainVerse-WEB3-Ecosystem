"use client"

import { useRef } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { Bitcoin, Cpu, Globe, Layers, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { COMMON_ROUTES } from "@/routes"

export function AuthVisuals() {
    const containerRef = useRef<HTMLDivElement>(null)
    const heroTextRef = useRef<HTMLHeadingElement>(null)
    const subTextRef = useRef<HTMLParagraphElement>(null)
    const iconsRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        // Initial entrance animations
        const tl = gsap.timeline()

        tl.from(containerRef.current, {
            opacity: 0,
            duration: 1,
            ease: "power2.out",
        })
            .from(heroTextRef.current, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            }, "-=0.5")
            .from(subTextRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            }, "-=0.6")
            .from(".floating-icon", {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "back.out(1.7)",
            }, "-=0.4")

        // Float animations for icons
        gsap.to(".floating-icon", {
            y: "random(-20, 20)",
            x: "random(-20, 20)",
            rotation: "random(-15, 15)",
            duration: "random(2, 4)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: {
                each: 0.5,
                from: "random",
            },
        })

        // Mouse movement parallax effect
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return

            const { clientX, clientY } = e
            const xPos = (clientX / window.innerWidth - 0.5) * 20
            const yPos = (clientY / window.innerHeight - 0.5) * 20

            gsap.to(iconsRef.current, {
                x: xPos,
                y: yPos,
                duration: 1,
                ease: "power2.out",
            })

            gsap.to(".bg-gradient-orb", {
                x: -xPos * 2,
                y: -yPos * 2,
                duration: 2,
                ease: "power2.out",
            })
        }

        window.addEventListener("mousemove", handleMouseMove)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, { scope: containerRef })

    return (
        <div
            ref={containerRef}
            className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0a0f] items-center justify-center p-12"
        >
            {/* Background Gradients & Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] bg-gradient-orb opacity-60" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-[120px] bg-gradient-orb opacity-60" />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.05 }}></div>
            </div>

            {/* Right Edge Blending Gradient - Smooth transition to form side */}
            <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent z-10 pointer-events-none" />

            {/* Floating Icons Container - Parallax Layer */}
            <div ref={iconsRef} className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-[15%] left-[15%] floating-icon text-cyan-400/30">
                    <Bitcoin size={60} strokeWidth={1} />
                </div>
                <div className="absolute top-[20%] right-[20%] floating-icon text-blue-400/30">
                    <Globe size={80} strokeWidth={1} />
                </div>
                <div className="absolute bottom-[25%] left-[20%] floating-icon text-indigo-400/30">
                    <Cpu size={70} strokeWidth={1} />
                </div>
                <div className="absolute bottom-[15%] right-[15%] floating-icon text-cyan-500/30">
                    <Layers size={50} strokeWidth={1} />
                </div>
                <div className="absolute top-[50%] left-[10%] floating-icon text-blue-500/20">
                    <ShieldCheck size={40} strokeWidth={1} />
                </div>
                <div className="absolute top-[45%] right-[10%] floating-icon text-indigo-300/20">
                    <Zap size={45} strokeWidth={1} />
                </div>

                {/* Connecting Lines (Simulated Blockchain) */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                    <line x1="15%" y1="15%" x2="25%" y2="25%" stroke="url(#line-gradient)" strokeWidth="1" />
                    <line x1="80%" y1="20%" x2="70%" y2="30%" stroke="url(#line-gradient)" strokeWidth="1" />
                    <line x1="20%" y1="75%" x2="30%" y2="65%" stroke="url(#line-gradient)" strokeWidth="1" />
                    <defs>
                        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
                            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.5)" />
                            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Main Content */}
            <div className="relative z-20 max-w-xl text-center">
                <div className="mb-8 flex justify-center">
                    <Link
                        href={COMMON_ROUTES.HOME}
                        className="block w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="w-full h-full rounded-2xl bg-[#0a0a0f] flex items-center justify-center backdrop-blur-xl group-hover:bg-[#0a0a0f]/80 transition-colors">
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-500">
                                C
                            </span>
                        </div>
                    </Link>
                </div>

                <h1
                    ref={heroTextRef}
                    className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
                >
                    Access the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                        Decentralized Future
                    </span>
                </h1>

                <p
                    ref={subTextRef}
                    className="text-lg text-gray-400 leading-relaxed max-w-md mx-auto"
                >
                    Experience the next generation of Web3 trading.
                    Secure, transparent, and built for the community.
                </p>

                {/* Feature Tags */}
                <div className="mt-12 flex flex-wrap justify-center gap-3">
                    {['Zero Fees', 'Instant Swap', 'AI Analytics'].map((tag, i) => (
                        <div
                            key={i}
                            className="px-5 py-2.5 rounded-full border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-md text-sm font-medium text-cyan-100 floating-icon shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-500/40 transition-colors"
                        >
                            {tag}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
