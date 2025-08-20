"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { useCryptoData } from "@/hooks/market/use-crypto-data"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function MarketStats() {
  const { data, loading } = useCryptoData()

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`
    return `$${volume.toFixed(0)}`
  }

  const calculateStats = () => {
    if (!data.length) return null

    const totalVolume = data.reduce((sum, crypto) => {
      const volume =
        Number.parseFloat(crypto.volume.replace(/[BMK]/g, "")) *
        (crypto.volume.includes("B") ? 1e9 : crypto.volume.includes("M") ? 1e6 : crypto.volume.includes("K") ? 1e3 : 1)
      return sum + volume
    }, 0)

    const positiveChanges = data.filter((crypto) => crypto.isPositive).length
    const marketSentiment = (positiveChanges / data.length) * 100

    return {
      totalVolume: formatVolume(totalVolume),
      marketSentiment: marketSentiment.toFixed(1),
      activeCoins: data.length,
      btcPrice: data.find((crypto) => crypto.symbol === "BTCUSDT")?.price || "N/A",
      btcDirection: data.find((crypto) => crypto.symbol === "BTCUSDT")?.priceDirection || "neutral",
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        className={cn(
          "transition-all duration-500",
          stats?.btcDirection === "up" && "ring-1 ring-green-500/30 bg-green-50/30 dark:bg-green-950/10",
          stats?.btcDirection === "down" && "ring-1 ring-red-500/30 bg-red-50/30 dark:bg-red-950/10",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bitcoin Price</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold transition-colors duration-300",
              stats?.btcDirection === "up" && "text-green-600 dark:text-green-400",
              stats?.btcDirection === "down" && "text-red-600 dark:text-red-400",
            )}
          >
            ${stats?.btcPrice}
          </div>
          <p className="text-xs text-muted-foreground">Live from Binance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalVolume}</div>
          <p className="text-xs text-muted-foreground">Combined volume</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.marketSentiment}%</div>
          <p className="text-xs text-muted-foreground">
            <span
              className={stats && Number.parseFloat(stats.marketSentiment) >= 50 ? "text-green-500" : "text-red-500"}
            >
              {stats && Number.parseFloat(stats.marketSentiment) >= 50 ? "Bullish" : "Bearish"}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tracked Coins</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeCoins}</div>
          <p className="text-xs text-muted-foreground">Live tracking</p>
        </CardContent>
      </Card>
    </div>
  )
}
