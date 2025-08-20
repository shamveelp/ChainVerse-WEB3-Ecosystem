"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown, Wallet } from 'lucide-react'
import axios from 'axios'
import Navbar from "@/components/home/navbar"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function CryptoWallet() {
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!")
      return
    }

    try {
      setLoading(true)
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        const address = accounts[0]
        setWalletAddress(address)
        setIsConnected(true)

        // Store wallet in database
        await storeWalletInDB(address)
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      alert("Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  const storeWalletInDB = async (address: string) => {
    try {
      const response = await axios.post('/api/wallet', {
        address: address,
        network: 'ethereum',
        timestamp: new Date().toISOString()
      })
      
      if (response.data.success) {
        console.log("Wallet stored successfully")
      }
    } catch (error) {
      console.error("Error storing wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setIsConnected(false)
    setFromAmount("")
    setToAmount("")
  }

  const handleSwap = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      setIsSwapping(true)
      
      // Simulate swap calculation (1 ETH = 2340 USDT)
      const ethToUsdtRate = 2340
      const calculatedAmount = (parseFloat(fromAmount) * ethToUsdtRate).toFixed(2)
      setToAmount(calculatedAmount)

      // Store swap transaction in database
      await axios.post('/api/wallet/swap', {
        walletAddress,
        fromToken: 'ETH',
        toToken: 'USDT',
        fromAmount: fromAmount,
        toAmount: calculatedAmount,
        timestamp: new Date().toISOString()
      })

      // Simulate processing time
      setTimeout(() => {
        setIsSwapping(false)
        alert(`Swap completed! ${fromAmount} ETH → ${calculatedAmount} USDT`)
      }, 2000)

    } catch (error) {
      console.error("Swap error:", error)
      setIsSwapping(false)
      alert("Swap failed. Please try again.")
    }
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && parseFloat(value) > 0) {
      // Auto calculate USDT amount (1 ETH = 2340 USDT)
      const calculated = (parseFloat(value) * 2340).toFixed(2)
      setToAmount(calculated)
    } else {
      setToAmount("")
    }
  }

  return (<>
  <Navbar />
  
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-md mx-auto pt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Crypto Wallet
          </h1>
          <p className="text-slate-400">Connect your wallet and swap tokens</p>
        </div>

        {/* Wallet Connection */}
        <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button 
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Connected Address:</p>
                  <p className="font-mono text-sm break-all">{walletAddress}</p>
                </div>
                <Button 
                  onClick={disconnectWallet}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swap Interface */}
        <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle>Token Swap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Token */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">From</span>
                <span className="text-sm text-slate-400">ETH</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
                  🔷
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="bg-transparent border-none text-right text-xl font-semibold focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="bg-slate-700 rounded-full p-2">
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </div>

            {/* To Token */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">To</span>
                <span className="text-sm text-slate-400">USDT</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center">
                  💚
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="bg-transparent border-none text-right text-xl font-semibold focus:ring-0 p-0 text-slate-300"
                />
              </div>
            </div>

            {/* Swap Rate */}
            {fromAmount && toAmount && (
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-600">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rate</span>
                  <span>1 ETH = 2,340 USDT</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">Network Fee</span>
                  <span className="text-green-400">~$2.50</span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={!isConnected || !fromAmount || !toAmount || isSwapping}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSwapping ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Swapping...
                </div>
              ) : !isConnected ? (
                "Connect Wallet First"
              ) : !fromAmount || !toAmount ? (
                "Enter Amount"
              ) : (
                "Swap ETH for USDT"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </>
  )
}
