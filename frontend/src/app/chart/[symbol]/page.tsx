"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CryptoChart } from "@/components/market/crypto-chart"
import Navbar from "@/components/home/navbar"

interface CryptoData {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  volume: string
  marketCap: string
  isPositive: boolean
}

interface ChartDataPoint {
  timestamp: number
  date: string
  price: number
  volume: number
}

const timeframes = [
  { label: "1H", interval: "1m", limit: "60" },
  { label: "24H", interval: "1h", limit: "24" },
  { label: "7D", interval: "4h", limit: "42" },
  { label: "30D", interval: "1d", limit: "30" },
]

export default function ChartPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params.symbol as string

  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[1])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCryptoData()
  }, [symbol])

  useEffect(() => {
    fetchChartData()
  }, [symbol, selectedTimeframe])

  const fetchCryptoData = async () => {
    try {
      const response = await fetch("/api/crypto")
      if (!response.ok) throw new Error("Failed to fetch crypto data")

      const data: CryptoData[] = await response.json()
      const crypto = data.find((c) => c.symbol === symbol)
      setCryptoData(crypto || null)
    } catch (err) {
      setError("Failed to load crypto data")
      console.error(err)
    }
  }

  const fetchChartData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/crypto/${symbol}/history?interval=${selectedTimeframe.interval}&limit=${selectedTimeframe.limit}`,
      )
      if (!response.ok) throw new Error("Failed to fetch chart data")

      const data: ChartDataPoint[] = await response.json()
      
      setChartData(data)
      setError(null)
    } catch (err) {
      console.error("[v0] Chart data fetch error:", err)
      setError("Failed to load chart data")
    } finally {
      setLoading(false)
    }
  }

  if (!cryptoData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading crypto data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-2xl font-bold">{cryptoData.name} Chart</h1>
        </div>
      </div>

      {/* Price Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{cryptoData.name}</CardTitle>
              <CardDescription>{cryptoData.symbol}</CardDescription>
            </div>
            <Badge variant={cryptoData.isPositive ? "default" : "destructive"}>
              {cryptoData.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {cryptoData.changePercent}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">${cryptoData.price}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={`text-lg font-semibold ${cryptoData.isPositive ? "text-green-600" : "text-red-600"}`}>
                {cryptoData.change}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-lg font-semibold">${cryptoData.volume}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-lg font-semibold">${cryptoData.marketCap}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Price Chart</CardTitle>
            <div className="flex gap-2">
              {timeframes.map((timeframe) => (
                <Button
                  key={timeframe.label}
                  variant={selectedTimeframe.label === timeframe.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchChartData} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <CryptoChart
              data={chartData}
              loading={loading}
              symbol={cryptoData.symbol}
              timeframe={selectedTimeframe.label}
            />
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
