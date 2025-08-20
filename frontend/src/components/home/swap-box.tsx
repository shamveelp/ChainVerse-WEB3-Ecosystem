"use client"

import type React from "react"
import { useState } from "react"
import { ArrowDown, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Coin {
  id: string
  name: string
  symbol: string
  icon: string // Placeholder for icon URL or component
}

const mockCoins: Coin[] = [
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "/placeholder.svg?height=24&width=24" },
  { id: "btc", name: "Bitcoin", symbol: "BTC", icon: "/placeholder.svg?height=24&width=24" },
  { id: "bnb", name: "Binance Coin", symbol: "BNB", icon: "/placeholder.svg?height=24&width=24" },
  { id: "sol", name: "Solana", symbol: "SOL", icon: "/placeholder.svg?height=24&width=24" },
  { id: "ada", name: "Cardano", symbol: "ADA", icon: "/placeholder.svg?height=24&width=24" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", icon: "/placeholder.svg?height=24&width=24" },
  { id: "dot", name: "Polkadot", symbol: "DOT", icon: "/placeholder.svg?height=24&width=24" },
  { id: "link", name: "Chainlink", symbol: "LINK", icon: "/placeholder.svg?height=24&width=24" },
  { id: "uni", name: "Uniswap", symbol: "UNI", icon: "/placeholder.svg?height=24&width=24" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", icon: "/placeholder.svg?height=24&width=24" },
]

export default function SwapBox() {
  const [fromCoin, setFromCoin] = useState<Coin>(mockCoins[0])
  const [toCoin, setToCoin] = useState<Coin>(mockCoins[1])
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [isCoinSelectionOpen, setIsCoinSelectionOpen] = useState(false)
  const [currentSelectionField, setCurrentSelectionField] = useState<"from" | "to" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleCoinSelect = (coin: Coin) => {
    if (currentSelectionField === "from") {
      setFromCoin(coin)
    } else if (currentSelectionField === "to") {
      setToCoin(coin)
    }
    setIsCoinSelectionOpen(false)
    setSearchQuery("") // Clear search query on selection
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, type: "from" | "to") => {
    const value = e.target.value
    if (type === "from") {
      setFromAmount(value)
      // Mock conversion
      setToAmount((Number.parseFloat(value) * 1.05).toFixed(4))
    } else {
      setToAmount(value)
      // Mock conversion
      setFromAmount((Number.parseFloat(value) / 1.05).toFixed(4))
    }
  }

  const handleMaxClick = (type: "from" | "to") => {
    if (type === "from") {
      setFromAmount("1000.00") // Mock max amount
      setToAmount((1000 * 1.05).toFixed(4))
    }
  }

  const swapCoins = () => {
    const tempCoin = fromCoin
    setFromCoin(toCoin)
    setToCoin(tempCoin)
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const filteredCoins = mockCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-lg border border-border shadow-xl rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center text-foreground">Swap Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="from-amount" className="text-sm font-medium text-muted-foreground">
                You pay
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMaxClick("from")}
                className="text-xs h-auto px-2 py-1"
              >
                Max
              </Button>
            </div>
            <div className="flex items-center bg-background rounded-lg border border-input pr-2">
              <Input
                id="from-amount"
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e, "from")}
                className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-2 bg-transparent"
              />
              <Dialog
                open={isCoinSelectionOpen && currentSelectionField === "from"}
                onOpenChange={setIsCoinSelectionOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-foreground hover:bg-accent"
                    onClick={() => {
                      setIsCoinSelectionOpen(true)
                      setCurrentSelectionField("from")
                    }}
                  >
                    <img
                      src={fromCoin.icon || "/placeholder.svg"}
                      alt={fromCoin.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-semibold">{fromCoin.symbol}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-lg">
                  <DialogHeader>
                    <DialogTitle>Select a token</DialogTitle>
                    <DialogDescription>Search for a token to swap from.</DialogDescription>
                  </DialogHeader>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name or paste address"
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid gap-2">
                      {filteredCoins.map((coin) => (
                        <Button
                          key={coin.id}
                          variant="ghost"
                          className="w-full justify-start gap-3 py-2 h-auto text-foreground hover:bg-accent"
                          onClick={() => handleCoinSelect(coin)}
                        >
                          <img src={coin.icon || "/placeholder.svg"} alt={coin.name} className="w-6 h-6 rounded-full" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground">{coin.symbol}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full bg-transparent" onClick={swapCoins}>
                  <ArrowDown className="h-5 w-5" />
                  <span className="sr-only">Swap coins</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Swap Coins</TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <label htmlFor="to-amount" className="text-sm font-medium text-muted-foreground">
              You receive
            </label>
            <div className="flex items-center bg-background rounded-lg border border-input pr-2">
              <Input
                id="to-amount"
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => handleAmountChange(e, "to")}
                className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-2 bg-transparent"
              />
              <Dialog
                open={isCoinSelectionOpen && currentSelectionField === "to"}
                onOpenChange={setIsCoinSelectionOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-foreground hover:bg-accent"
                    onClick={() => {
                      setIsCoinSelectionOpen(true)
                      setCurrentSelectionField("to")
                    }}
                  >
                    <img src={toCoin.icon || "/placeholder.svg"} alt={toCoin.name} className="w-6 h-6 rounded-full" />
                    <span className="font-semibold">{toCoin.symbol}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-lg">
                  <DialogHeader>
                    <DialogTitle>Select a token</DialogTitle>
                    <DialogDescription>Search for a token to swap to.</DialogDescription>
                  </DialogHeader>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name or paste address"
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid gap-2">
                      {filteredCoins.map((coin) => (
                        <Button
                          key={coin.id}
                          variant="ghost"
                          className="w-full justify-start gap-3 py-2 h-auto text-foreground hover:bg-accent"
                          onClick={() => handleCoinSelect(coin)}
                        >
                          <img src={coin.icon || "/placeholder.svg"} alt={coin.name} className="w-6 h-6 rounded-full" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground">{coin.symbol}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Slippage Tolerance</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Received</span>
              <span>
                {(Number.parseFloat(toAmount) * 0.995).toFixed(4)} {toCoin.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Gas</span>
              <span>0.0005 ETH</span>
            </div>
          </div>

          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 rounded-xl">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
