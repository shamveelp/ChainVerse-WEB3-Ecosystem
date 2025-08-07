"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, Settings, LogOut, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { closeWallet, disconnectWallet, switchNetwork } from "@/redux/slices/walletSlice"
import { useState } from "react"

const networks = [
  { id: 1, name: "Ethereum", symbol: "ETH", color: "bg-blue-500", active: true },
  { id: 56, name: "BSC", symbol: "BNB", color: "bg-yellow-500", active: false },
  { id: 137, name: "Polygon", symbol: "MATIC", color: "bg-purple-500", active: false },
  { id: 43114, name: "Avalanche", symbol: "AVAX", color: "bg-red-500", active: false },
]

const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "2.5", value: "$5,851.25", icon: "🔷" },
  { symbol: "USDT", name: "Tether USD", balance: "1,250.00", value: "$1,250.00", icon: "💚" },
  { symbol: "USDC", name: "USD Coin", balance: "500.00", value: "$500.00", icon: "🔵" },
]

const recentTransactions = [
  { type: "send", token: "ETH", amount: "0.5", to: "0x742d...4e8a", time: "2 min ago", status: "confirmed" },
  { type: "receive", token: "USDT", amount: "100", from: "0x8ba1...f2c3", time: "1 hour ago", status: "confirmed" },
  { type: "swap", token: "ETH → USDT", amount: "1.2", time: "3 hours ago", status: "pending" },
]

export default function WalletSidebar() {
  const dispatch = useAppDispatch()
  const { isOpen, isConnected, address, balance, network } = useAppSelector((state) => state.wallet)
  const [showNetworks, setShowNetworks] = useState(false)

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  const handleDisconnect = () => {
    dispatch(disconnectWallet())
    dispatch(closeWallet())
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Sheet open={isOpen} onOpenChange={() => dispatch(closeWallet())}>
      <SheetContent side="right" className="w-full sm:w-96 bg-slate-900 border-slate-700 text-white p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDisconnect} className="text-slate-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6">
            {isConnected ? (
              <div className="space-y-6">
                {/* Account Info */}
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Main Account</p>
                        <p className="text-sm text-slate-400">{address && formatAddress(address)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopyAddress} className="text-slate-400 hover:text-white">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">${balance}</p>
                    <p className="text-sm text-slate-400">Total Balance</p>
                  </div>
                </Card>

                {/* Network Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Network</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowNetworks(!showNetworks)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showNetworks ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  
                  <Card className="bg-slate-800/50 border-slate-700 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">ETH</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ethereum Mainnet</p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-xs text-slate-400">Connected</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  </Card>

                  {showNetworks && (
                    <div className="mt-2 space-y-2">
                      {networks.filter(n => !n.active).map((network) => (
                        <Card key={network.id} className="bg-slate-800/30 border-slate-700 p-3 cursor-pointer hover:bg-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${network.color} rounded-full flex items-center justify-center`}>
                              <span className="text-xs font-bold text-white">{network.symbol}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{network.name}</p>
                              <span className="text-xs text-slate-400">Switch Network</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" className="flex flex-col gap-2 h-auto py-4 border-slate-600 hover:bg-slate-700">
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                      <span className="text-xs">Send</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col gap-2 h-auto py-4 border-slate-600 hover:bg-slate-700">
                      <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      <span className="text-xs">Receive</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col gap-2 h-auto py-4 border-slate-600 hover:bg-slate-700">
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                      <span className="text-xs">Swap</span>
                    </Button>
                  </div>
                </div>

                {/* Token Balances */}
                <div>
                  <h3 className="font-medium mb-3">Assets</h3>
                  <div className="space-y-2">
                    {tokens.map((token) => (
                      <Card key={token.symbol} className="bg-slate-800/30 border-slate-700 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{token.icon}</div>
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-sm text-slate-400">{token.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{token.balance}</p>
                            <p className="text-sm text-slate-400">{token.value}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Recent Activity</h3>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentTransactions.map((tx, index) => (
                      <Card key={index} className="bg-slate-800/30 border-slate-700 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === 'send' ? 'bg-red-500/20 text-red-400' :
                              tx.type === 'receive' ? 'bg-green-500/20 text-green-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {tx.type === 'send' ? <ArrowUpRight className="w-4 h-4" /> :
                               tx.type === 'receive' ? <ArrowDownLeft className="w-4 h-4" /> :
                               <RefreshCw className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{tx.type}</p>
                              <p className="text-sm text-slate-400">{tx.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{tx.amount} {tx.token}</p>
                            <div className="flex items-center gap-1">
                              {tx.status === 'confirmed' ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-yellow-400" />
                              )}
                              <span className="text-xs text-slate-400 capitalize">{tx.status}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-slate-400 mb-6">Connect your wallet to start trading</p>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
