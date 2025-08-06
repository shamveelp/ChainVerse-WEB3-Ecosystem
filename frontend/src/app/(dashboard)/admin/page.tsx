"use client"

import { useSelector } from "react-redux"
import { BarChart3, TrendingUp, Users, Activity, DollarSign, Shield, Sparkles, Coins, Wallet, Zap, Database, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RootState } from "@/redux/store"

// Web3 themed stats data
const stats = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+12.5%",
    changeType: "increase",
    icon: Users,
    color: "from-cyan-400 to-blue-500"
  },
  {
    title: "Active Wallets",
    value: "8,234",
    change: "+8.2%",
    changeType: "increase",
    icon: Wallet,
    color: "from-green-400 to-emerald-500"
  },
  {
    title: "Total Volume",
    value: "$2.4M",
    change: "+23.1%",
    changeType: "increase",
    icon: DollarSign,
    color: "from-purple-400 to-pink-500"
  },
  {
    title: "Network Health",
    value: "99.9%",
    change: "+0.1%",
    changeType: "increase",
    icon: Shield,
    color: "from-orange-400 to-red-500"
  }
]

const recentTransactions = [
  { hash: "0x1a2b3c...", type: "Transfer", amount: "1,250 CHAIN", status: "confirmed", time: "2 min ago" },
  { hash: "0x4d5e6f...", type: "Swap", amount: "500 ETH", status: "pending", time: "5 min ago" },
  { hash: "0x7g8h9i...", type: "Stake", amount: "10,000 CHAIN", status: "confirmed", time: "8 min ago" },
  { hash: "0xj1k2l3...", type: "Bridge", amount: "2,500 USDC", status: "confirmed", time: "12 min ago" },
]

export default function AdminDashboard() {
  const { admin } = useSelector((state: RootState) => state.adminAuth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="h-8 w-8 text-cyan-400" />
            ChainVerse - Admin Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Welcome back, <span className="text-cyan-400 font-semibold">{admin?.name || 'Administrator'}</span>. Network status: Optimal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-cyan-400/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="flex items-center text-xs">
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-400 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-400 mr-1" />
                )}
                <span className={stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'}>{stat.change}</span>
                <span className="text-slate-500 ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Activity Chart */}
        <Card className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Network Activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time blockchain performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg">
              <div className="text-center space-y-3">
                <Activity className="h-12 w-12 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-slate-400">Network activity visualization</p>
                <p className="text-xs text-slate-500">Chart component integration point</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-cyan-400/30 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <Coins className="h-3 w-3 text-cyan-400" />
                    {tx.type}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{tx.hash}</p>
                  <p className="text-xs text-cyan-400 font-semibold">{tx.amount}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge 
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                    className={tx.status === 'confirmed' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {tx.status}
                  </Badge>
                  <p className="text-xs text-slate-500">{tx.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Token Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">CHAIN Token</span>
                <span className="text-sm font-semibold text-white">45.2%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{width: '45.2%'}}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Staked</span>
                <span className="text-sm font-semibold text-white">32.8%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" style={{width: '32.8%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Network Security</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Smart Contracts</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Last Audit</span>
                <span className="text-xs text-slate-500">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">TPS</span>
                <span className="text-sm font-semibold text-white">2,847</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Block Time</span>
                <span className="text-sm font-semibold text-white">2.1s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Gas Price</span>
                <span className="text-sm font-semibold text-white">12 gwei</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
