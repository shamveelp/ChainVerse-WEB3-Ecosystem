"use client"

import { useState } from "react"
import { ArrowUpDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SwapBox() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  return (
    <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-md border-blue-800/30">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-200">Swap</CardTitle>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>From</span>
            <span>Balance: 0.00</span>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white text-lg h-12"
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700 px-4 bg-transparent">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                <span>BTC</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-blue-400 hover:bg-slate-700 rounded-full"
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>To</span>
            <span>Balance: 0.00</span>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white text-lg h-12"
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700 px-4 bg-transparent">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                <span>ETH</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Swap Info */}
        <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Rate</span>
            <span>1 BTC = 15.24 ETH</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee</span>
            <span>0.3%</span>
          </div>
        </div>

        {/* Swap Button */}
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg font-semibold">
          Connect Wallet
        </Button>
      </CardContent>
    </Card>
  )
}
