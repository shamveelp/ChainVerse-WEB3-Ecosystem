"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface CryptoChartProps {
  data: Array<{
    timestamp: number
    date: string
    price: number
    volume: number
  }>
  loading: boolean
  symbol: string
  timeframe: string
}

export function CryptoChart({ data, loading, symbol, timeframe }: CryptoChartProps) {
  
  
  

  const formatXAxisLabel = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeframe === "1H" || timeframe === "24H") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const formatTooltipLabel = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{formatTooltipLabel(Number(label))}</p>
          <p className="text-sm text-green-600">Price: ${Number(payload[0].value).toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">No chart data available</div>
    )
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} stroke="#64748b" fontSize={12} />
          <YAxis
            domain={["dataMin - 50", "dataMax + 50"]}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="transparent"
            fill="url(#priceGradient)"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "#22c55e" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
