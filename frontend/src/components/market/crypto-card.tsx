"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { CryptoDataWithChanges } from "@/hooks/market/use-crypto-data"

interface CryptoCardProps {
  crypto: CryptoDataWithChanges
}

export function CryptoCard({ crypto }: CryptoCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/chart/${crypto.symbol}`)
  }

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden",
        crypto.priceDirection === "up" && "ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20",
        crypto.priceDirection === "down" && "ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-950/20",
        crypto.isUpdating && "opacity-75",
      )}
      onClick={handleClick}
    >
      {crypto.isUpdating && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{crypto.symbol.slice(0, 3)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{crypto.name}</h3>
              <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
            </div>
          </div>
          <Badge variant={crypto.isPositive ? "default" : "destructive"} className="text-xs">
            {crypto.changePercent}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-2xl font-bold transition-all duration-500",
              crypto.priceDirection === "up" && "text-green-600 dark:text-green-400",
              crypto.priceDirection === "down" && "text-red-600 dark:text-red-400",
            )}
          >
            ${crypto.price}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 text-sm transition-all duration-300",
              crypto.isPositive ? "text-green-500" : "text-red-500",
              crypto.priceDirection === "up" && "scale-110",
              crypto.priceDirection === "down" && "scale-110",
            )}
          >
            {crypto.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {crypto.change}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Vol:</span>
            <span className="font-medium">{crypto.volume}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">MCap:</span>
            <span className="font-medium">{crypto.marketCap}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">Click to view detailed chart</div>
      </CardContent>
    </Card>
  )
}
