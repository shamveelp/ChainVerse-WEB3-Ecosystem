"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"

interface Coin {
  id: string
  name: string
  symbol: string
  image: string
  current_price?: number
}

// Fallback data
const fallbackCoins: Coin[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 65000 },
  { id: "ethereum", name: "Ethereum", symbol: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 3500 },
]

export default function SwapBox() {
  const [fromCoin, setFromCoin] = useState<Coin>(fallbackCoins[0])
  const [toCoin, setToCoin] = useState<Coin>(fallbackCoins[1])
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch only BTC and ETH to get real prices
  useEffect(() => {
    const fetchCoins = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              ids: "bitcoin,ethereum", // Fetch only these two
              order: "market_cap_desc",
              sparkline: false,
            },
          }
        )
        if (response.data && Array.isArray(response.data)) {
          const btc = response.data.find((c: Coin) => c.id === "bitcoin")
          const eth = response.data.find((c: Coin) => c.id === "ethereum")

          if (btc && eth) {
            // Preserve current order (who is from/to) but update data
            if (fromCoin.id === "bitcoin") {
              setFromCoin(btc)
              setToCoin(eth)
            } else {
              setFromCoin(eth)
              setToCoin(btc)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch coins:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoins()
  }, []) // Run only once

  const updateEstimate = (val: string, type: "from" | "to", fCoin: Coin, tCoin: Coin) => {
    const fromPrice = fCoin.current_price || 0
    const toPrice = tCoin.current_price || 1

    if (!val || isNaN(parseFloat(val))) {
      if (type === 'from') setToAmount("")
      else setFromAmount("")
      return
    }

    const amount = parseFloat(val)

    if (type === "from") {
      const estimated = (amount * fromPrice / toPrice).toFixed(6)
      setToAmount(estimated)
    } else {
      const estimated = (amount * toPrice / fromPrice).toFixed(6)
      setFromAmount(estimated)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, type: "from" | "to") => {
    const value = e.target.value
    if (type === "from") {
      setFromAmount(value)
      updateEstimate(value, "from", fromCoin, toCoin)
    } else {
      setToAmount(value)
      updateEstimate(value, "to", fromCoin, toCoin)
    }
  }

  const handleMaxClick = (type: "from" | "to") => {
    if (type === "from") {
      const maxVal = "1.5432"
      setFromAmount(maxVal)
      updateEstimate(maxVal, "from", fromCoin, toCoin)
    }
  }

  const swapCoins = () => {
    const tempCoin = fromCoin
    setFromCoin(toCoin)
    setToCoin(tempCoin)

    // Swap amounts logically
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center text-white">Swap Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="from-amount" className="text-sm font-medium text-gray-400">
                You pay
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMaxClick("from")}
                className="text-xs h-auto px-2 py-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              >
                Max
              </Button>
            </div>
            <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 pr-2 hover:border-white/20 transition-colors">
              <Input
                id="from-amount"
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e, "from")}
                className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-2xl font-bold py-6 bg-transparent text-white placeholder:text-gray-600"
              />
              <div className="flex items-center gap-2 text-white bg-white/5 rounded-xl px-3 py-2 h-auto border border-white/5 mx-2">
                <img
                  src={fromCoin.image || "/placeholder.svg"}
                  alt={fromCoin.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-semibold uppercase">{fromCoin.symbol}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-black/50 border-white/10 text-white hover:bg-white/10 hover:border-white/30 h-10 w-10 backdrop-blur-md"
                  onClick={swapCoins}
                >
                  <ArrowDown className="h-5 w-5" />
                  <span className="sr-only">Swap coins</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Swap Coins</TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <label htmlFor="to-amount" className="text-sm font-medium text-gray-400">
              You receive
            </label>
            <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 pr-2 hover:border-white/20 transition-colors">
              <Input
                id="to-amount"
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => handleAmountChange(e, "to")}
                className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-2xl font-bold py-6 bg-transparent text-white placeholder:text-gray-600"
              />
              <div className="flex items-center gap-2 text-white bg-white/5 rounded-xl px-3 py-2 h-auto border border-white/5 mx-2">
                <img src={toCoin.image || "/placeholder.svg"} alt={toCoin.name} className="w-6 h-6 rounded-full" />
                <span className="font-semibold uppercase">{toCoin.symbol}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-sm text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between">
              <span>Slippage Tolerance</span>
              <span className="text-white">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Received</span>
              <span className="text-white">
                {toAmount ? (Number.parseFloat(toAmount) * 0.995).toFixed(6) : "0.00"} {toCoin.symbol.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Gas</span>
              <span className="text-white">~$5.00</span>
            </div>
          </div>

          <Button className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
