"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { COMMON_ROUTES } from "@/routes"
import { Button } from "@/components/ui/button"
import SwapBox from "./swap-box"
import { ArrowRight, Bitcoin, Hexagon, Terminal, Activity } from "lucide-react"

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const shapesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background Shapes Animation
      const shapes = gsap.utils.toArray(".floating-shape") as HTMLElement[]
      shapes.forEach((shape) => {
        gsap.to(shape, {
          x: "random(-100, 100)",
          y: "random(-100, 100)",
          rotation: "random(-180, 180)",
          scale: "random(0.8, 1.2)",
          duration: "random(10, 20)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      })

      // Text Reveal Animation
      const tl = gsap.timeline()

      tl.from(".hero-text-line", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power4.out",
      })
        .from(".hero-cta", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
        }, "-=0.5")
        .from(".swap-container", {
          x: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        }, "-=0.8")

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center bg-[#050511] overflow-hidden pt-24 pb-12 md:pt-32"
    >
      {/* Abstract Background */}
      <div ref={shapesRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="floating-shape absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="floating-shape absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="floating-shape absolute top-[20%] right-[20%] w-[20vw] h-[20vw] bg-cyan-900/10 rounded-full blur-[80px]" />

        {/* Abstract Grid or Particles could go here */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* Left Content */}
          <div ref={textRef} className="space-y-8 text-center lg:text-left">
            <div className="hero-text-line inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-300">Live on Mainnet</span>
            </div>

            <h1 className="hero-text-line text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Decentralized Trading
              </span>
            </h1>

            <p className="hero-text-line text-lg md:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience lightning-fast swaps, low fees, and deep liquidity.
              ChainVerse brings the power of Web3 to your fingertips.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href={COMMON_ROUTES.GET_STARTED} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-white text-black hover:bg-gray-100 rounded-full transition-transform hover:scale-105">
                  Launch App
                </Button>
              </Link>
              <Link href={COMMON_ROUTES.DOCS} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 rounded-full backdrop-blur-sm">
                  Explore Docs
                </Button>
              </Link>
            </div>

            <div className="hero-text-line pt-8 flex items-center justify-center lg:justify-start gap-8 text-gray-500">
              <Bitcoin className="w-6 h-6 hover:text-white transition-colors" />
              <Hexagon className="w-6 h-6 hover:text-white transition-colors" />
              <Terminal className="w-6 h-6 hover:text-white transition-colors" />
              <Activity className="w-6 h-6 hover:text-white transition-colors" />
            </div>
          </div>

          {/* Right Content - Swap Box */}
          <div className="swap-container relative flex justify-center lg:justify-end">
            {/* Glow effect behind swap box */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl transform scale-110 -z-10 rounded-full" />

            <div className="relative w-full max-w-md">
              <SwapBox />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
