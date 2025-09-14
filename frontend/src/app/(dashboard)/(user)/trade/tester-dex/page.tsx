'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalUsers: 0,
    totalLiquidity: 0,
    activeTrades: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalVolume: 1250000,
      totalUsers: 15420,
      totalLiquidity: 850000,
      activeTrades: 234
    });
  }, []);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Advanced Trading",
      description: "Spot trading with limit orders and real-time market data"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Liquidity Pools",
      description: "Earn rewards by providing liquidity to trading pairs"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Fiat On-Ramp",
      description: "Buy crypto directly with INR using Razorpay integration"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Low Fees",
      description: "Competitive 0.5% trading fees across all pairs"
    }
  ];

  const tokens = [
    { name: "Uthradam", symbol: "UTH", price: 0.0012, change: "+5.2%" },
    { name: "Thiruvonam", symbol: "THV", price: 0.0008, change: "+2.1%" },
    { name: "Avittam", symbol: "AVT", price: 0.0015, change: "-1.3%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"></div>
              <span className="text-white text-xl font-bold">ChainVerse DEX</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/trade">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Trade
                </Button>
              </Link>
              <Link href="/pools">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Pools
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Connect Wallet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Trade the Future of
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}Decentralized Finance
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience seamless trading, liquidity provision, and fiat on-ramp services on Sepolia testnet. 
              Trade UTH, THV, and AVT tokens with advanced features and competitive fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/trade">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Start Trading
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/buy-crypto">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Buy Crypto with INR
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white">${stats.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Volume</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white">${stats.totalLiquidity.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Liquidity</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white">{stats.activeTrades}</div>
              <div className="text-sm text-gray-400">Active Trades</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose ChainVerse DEX</h2>
          <p className="text-gray-300 text-lg">Advanced features designed for modern DeFi trading</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Prices */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Featured Tokens</h2>
          <p className="text-gray-300 text-lg">Real-time prices for ChainVerse ecosystem tokens</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tokens.map((token, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{token.name}</h3>
                    <p className="text-gray-400">{token.symbol}</p>
                  </div>
                  <Badge 
                    variant={token.change.startsWith('+') ? 'default' : 'destructive'}
                    className={token.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : ''}
                  >
                    {token.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">{token.price} ETH</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-white/20 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Trading?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands of traders on ChainVerse DEX and experience the future of decentralized trading
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/trade">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Launch App
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Read Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                <span className="text-white font-bold">ChainVerse DEX</span>
              </div>
              <p className="text-gray-400 text-sm">
                The most advanced decentralized exchange on Sepolia testnet
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/trade" className="text-gray-400 hover:text-white">Spot Trading</a></li>
                <li><a href="/pools" className="text-gray-400 hover:text-white">Liquidity Pools</a></li>
                <li><a href="/buy-crypto" className="text-gray-400 hover:text-white">Buy Crypto</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/docs" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="/help" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Twitter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Discord</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 ChainVerse DEX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}