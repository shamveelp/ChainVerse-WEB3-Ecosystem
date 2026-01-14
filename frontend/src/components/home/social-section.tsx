"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Users, MessageSquare, Share2, Globe, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(ScrollTrigger)

export default function SocialSection() {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Philosophy Text Animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".social-motto",
          start: "top 75%",
        }
      })

      tl.from(".motto-word", {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out"
      })

      // Icons Float Animation
      gsap.to(".social-icon-float", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          amount: 1.5,
          from: "random"
        }
      })

    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="py-32 px-4 bg-gradient-to-b from-[#0a0a1a] to-black relative">

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">

        <div className="social-motto mb-20">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
            <span className="motto-word inline-block mr-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Connect.
            </span>
            <span className="motto-word inline-block mr-4 text-white">
              Share.
            </span>
            <span className="motto-word inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Build.
            </span>
          </h2>
          <p className="mt-8 text-xl text-gray-400 max-w-2xl mx-auto motto-word opacity-0">
            Join the fastest growing Web3 community. Your decentralized identity starts here.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="social-icon-float p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Join Communities</h3>
            <p className="text-gray-400">Connect with enthusiasts from 150+ countries.</p>
          </div>
          <div className="social-icon-float p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors" style={{ animationDelay: "0.5s" }}>
            <MessageSquare className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Talk to One Another</h3>
            <p className="text-gray-400">Privacy-focused messaging for secure collaborations.</p>
          </div>
          <div className="social-icon-float p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors" style={{ animationDelay: "1s" }}>
            <Globe className="w-12 h-12 text-purple-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Join ChainCast</h3>
            <p className="text-gray-400">Vote on proposals and shape the platform's future.</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
            Join Discord
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10">
            Follow Twitter
          </Button>
        </div>

      </div>
    </section>
  )
}
