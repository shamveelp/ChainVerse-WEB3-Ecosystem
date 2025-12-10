"use client"

import Link from "next/link"
import { COMMON_ROUTES } from "@/routes"
import { Button } from "@/components/ui/button"
import FloatingShapes from "./floating-shapes"
import SwapBox from "./swap-box"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bitcoin,
  EclipseIcon as Ethereum,
  OctagonIcon as Polygon,
  DollarSign,
  TrendingUp,
  Newspaper,
} from "lucide-react"
import { useEffect, useState } from "react"

const communityMessages = [
  "Latest: New governance proposal for ChainVerse DAO is live! Vote now!",
  "Community Spotlight: Meet our top contributor, CryptoKing!",
  "Event Alert: Join our AMA with the core dev team next Friday!",
  "Partnership Announcement: ChainVerse partners with DeFi Protocol X!",
  "Bug Bounty: Help us find bugs and earn rewards!",
  "Development Update: Q3 roadmap released, check out the new features!",
  "AMA Recap: Missed the last AMA? Read the full transcript here!",
]

const cryptoCoins = [
  { name: "Bitcoin", symbol: "BTC", icon: <Bitcoin className="h-6 w-6 text-orange-400" /> },
  { name: "Ethereum", symbol: "ETH", icon: <Ethereum className="h-6 w-6 text-blue-400" /> },
  { name: "Polygon", symbol: "MATIC", icon: <Polygon className="h-6 w-6 text-purple-400" /> },
  { name: "Solana", symbol: "SOL", icon: <TrendingUp className="h-6 w-6 text-green-400" /> },
  { name: "BNB", symbol: "BNB", icon: <DollarSign className="h-6 w-6 text-yellow-400" /> },
]

export default function HeroSection() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % communityMessages.length)
    }, 5000) // Change message every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <section className="relative w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-950 to-black text-white flex items-center justify-center overflow-hidden py-16 md:py-24 lg:py-32">
        <FloatingShapes />
        <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark overlay for readability */}
        <div className="relative z-20 container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in-up">
              Unleash WEB3 Full Potential
            </h1>
            <p
              className="text-lg md:text-xl text-gray-300 max-w-2xl animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Trade, earn, and connect in a decentralized world. ChainVerse offers a seamless and secure experience for
              all your crypto needs.
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  <Link href={COMMON_ROUTES.GET_STARTED}>Get Started</Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start your Web3 journey</TooltipContent>
            </Tooltip>

            <div
              className="mt-12 flex flex-wrap justify-center lg:justify-start gap-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              {cryptoCoins.map((coin) => (
                <Tooltip key={coin.symbol}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 text-gray-200">
                      {coin.icon}
                      <span className="text-sm font-medium">{coin.symbol}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{coin.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Right Content - Swap Box */}
          <div className="flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            <SwapBox />
          </div>
        </div>
        {/* Moving Messages */}

      </section>
    </TooltipProvider>
  )
}
