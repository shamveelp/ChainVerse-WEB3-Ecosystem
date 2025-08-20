"use client"

import { TrendingUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MarketHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onWatchlistClick?: () => void
}

export function MarketHeader({ searchTerm, onSearchChange, onWatchlistClick }: MarketHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <TrendingUp className="h-8 w-8 text-primary" /> */}
            {/* <h1 className="text-2xl font-bold text-foreground">CryptoMarket</h1> */}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            
          </div>
        </div>
      </div>
    </header>
  )
}
