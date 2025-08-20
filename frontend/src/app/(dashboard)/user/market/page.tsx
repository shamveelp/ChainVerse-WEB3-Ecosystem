"use client"

import { useState } from "react"
import { MarketHeader } from "@/components/market/market-header"
import { CryptoGrid } from "@/components/market/crypto-grid"
import { MarketStats } from "@/components/market/market-stats"
import Navbar from "@/components/home/navbar"

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-background">
      <MarketHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onWatchlistClick={() => console.log("Watchlist clicked")}
      />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <MarketStats />
        <CryptoGrid searchTerm={searchTerm} />
      </main>
    </div>
    
    </>
  )
}
