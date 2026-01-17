"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CryptoChart } from "@/components/market/crypto-chart"
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CryptoData } from "@/services/market/binance-api"

interface CryptoDetailModalProps {
  crypto: CryptoData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CryptoDetailModal({ crypto, open, onOpenChange }: CryptoDetailModalProps) {
  if (!crypto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{crypto.symbol.slice(0, 3)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{crypto.name}</h2>
              <p className="text-muted-foreground">{crypto.symbol}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-3xl font-bold">${crypto.price}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">24h Change</p>
              <div className={cn("flex items-center gap-1", crypto.isPositive ? "text-green-500" : "text-red-500")}>
                {crypto.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-xl font-semibold">{crypto.change}</span>
                <Badge variant={crypto.isPositive ? "default" : "destructive"}>{crypto.changePercent}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                24h Volume
              </p>
              <p className="text-xl font-semibold">{crypto.volume}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Market Cap
              </p>
              <p className="text-xl font-semibold">{crypto.marketCap}</p>
            </div>
          </div>

          {/* Interactive Chart */}
          <CryptoChart {...({ symbol: crypto.symbol, name: crypto.name } as any)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
