import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

const mockChartData = [
  { name: "Mon", btc: 65000, eth: 3500, matic: 0.7 },
  { name: "Tue", btc: 66500, eth: 3650, matic: 0.72 },
  { name: "Wed", btc: 67000, eth: 3700, matic: 0.73 },
  { name: "Thu", btc: 68000, eth: 3750, matic: 0.74 },
  { name: "Fri", btc: 68500, eth: 3800, matic: 0.75 },
  { name: "Sat", btc: 69000, eth: 3850, matic: 0.76 },
  { name: "Sun", btc: 68800, eth: 3820, matic: 0.74 },
]

export default function MarketSection() {
  return (
    <section className="relative w-full py-16 md:py-24 bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-green-200 dark:bg-green-800 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Explore the Dynamic Crypto Market
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
          Stay updated with real-time prices, charts, and market trends for your favorite cryptocurrencies.
        </p>

        <Card className="w-full max-w-5xl mx-auto bg-card/80 backdrop-blur-lg border border-border shadow-xl rounded-xl p-6 md:p-8">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="text-sm text-muted-foreground">Bitcoin (BTC)</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground">$68,500</span>
                <span className="text-green-500 flex items-center text-sm">
                  <ArrowUpRight className="h-4 w-4" /> 1.2%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <div className="text-sm text-muted-foreground">Ethereum (ETH)</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground">$3,800</span>
                <span className="text-red-500 flex items-center text-sm">
                  <ArrowDownRight className="h-4 w-4" /> 0.5%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <div className="text-sm text-muted-foreground">Polygon (MATIC)</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground">$0.75</span>
                <span className="text-green-500 flex items-center text-sm">
                  <ArrowUpRight className="h-4 w-4" /> 2.1%
                </span>
              </div>
            </div>
            <div className="md:col-span-3 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="btc"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorBtc)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 mt-8">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Link href="/market">Go to Market</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="text-primary border-primary hover:bg-primary/10 text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105 bg-transparent"
          >
            <Link href="/trade/swap">Trade Now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
