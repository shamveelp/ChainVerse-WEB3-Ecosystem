"use client"

import { useEffect, useState } from "react"

const messages = [
  "🚀 New DeFi protocols launching daily",
  "💎 Exclusive NFT drops available",
  "⚡ Lightning-fast cross-chain swaps",
  "🎯 Complete quests and earn rewards",
  "🌟 Join the Web3 revolution today",
  "🔥 Trending tokens gaining momentum",
  "💰 Yield farming opportunities",
  "🎮 GameFi integration coming soon",
]

export default function MovingMessages() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-y border-blue-800/30">
      <div className="overflow-hidden">
        <div className="flex animate-pulse">
          <div className="flex space-x-8 animate-marquee">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex-shrink-0 px-6 py-3 rounded-full border transition-all duration-500 ${
                  index === currentIndex
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/30 border-slate-700/50 text-gray-400"
                }`}
              >
                <span className="text-sm font-medium whitespace-nowrap">{message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
