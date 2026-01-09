"use client"

import { useEffect } from "react"
import Lenis from "@studio-freight/lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Navbar from "@/components/home/navbar"
import HeroSection from "@/components/home/hero-section"
import NFTSection from "@/components/home/nft-section"
import SocialSection from "@/components/home/social-section"
import RewardsSection from "@/components/home/rewards-section"
import Footer from "@/components/home/footer"

// Register ScrollTrigger globally
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HomePage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Integrate GSAP with Lenis
    /*
    // Optional: if ScrollTrigger needs to sync perfectly with Lenis, 
    // but usually standard ScrollTrigger works fine with Lenis without proxying 
    // unless you are scrubbing very specific complex animations.
    // For now we keep it simple.
    */

    return () => lenis.destroy()
  }, [])

  return (
    <div className="dark min-h-screen flex flex-col bg-black text-white selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <HeroSection />
        <NFTSection />
        <SocialSection />
        <RewardsSection />
      </main>
      <Footer />
    </div>
  )
}