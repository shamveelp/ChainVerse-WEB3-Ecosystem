"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageCircle, Heart, Share2, TrendingUp, Zap, Crown, Plus, LogIn, Shield, Sparkles, Activity, Calendar, Eye, ThumbsUp, Star } from 'lucide-react'
import type { RootState } from "@/redux/store"
import Navbar from "@/components/home/navbar"

// Mock community posts data
const communityPosts = [
  {
    id: 1,
    author: {
      name: "Alex Chen",
      username: "alexweb3",
      avatar: "/crypto-trader.png",
      badge: "Diamond Holder",
      level: "Level 15"
    },
    content: "Just discovered an amazing DeFi protocol that's revolutionizing yield farming! The APY is incredible and the tokenomics are solid. 🚀",
    timestamp: "2 hours ago",
    likes: 42,
    comments: 18,
    shares: 7,
    tags: ["DeFi", "YieldFarming", "Web3"],
    trending: true
  },
  {
    id: 2,
    author: {
      name: "Sarah Martinez",
      username: "cryptoqueen",
      avatar: "/female-developer.png",
      badge: "NFT Creator",
      level: "Level 12"
    },
    content: "Excited to announce that our NFT collection just hit 1000 holders! Thank you to the amazing ChainVerse community for the support. Next milestone: 5000! 🎨✨",
    timestamp: "4 hours ago",
    likes: 128,
    comments: 34,
    shares: 22,
    tags: ["NFT", "Community", "Milestone"],
    trending: false
  },
  {
    id: 3,
    author: {
      name: "Marcus Johnson",
      username: "blockchaindev",
      avatar: "/blockchain-developer.png",
      badge: "Smart Contract Auditor",
      level: "Level 20"
    },
    content: "New smart contract deployment on ChainVerse mainnet! Gas fees are incredibly low and transaction speeds are lightning fast. The future is here! ⚡",
    timestamp: "6 hours ago",
    likes: 89,
    comments: 25,
    shares: 15,
    tags: ["SmartContracts", "Mainnet", "Development"],
    trending: true
  },
  {
    id: 4,
    author: {
      name: "Luna Park",
      username: "defiexplorer",
      avatar: "/asian-woman-crypto.png",
      badge: "Liquidity Provider",
      level: "Level 8"
    },
    content: "Market analysis: ChainVerse token showing strong bullish patterns. Technical indicators suggest we might see a breakout soon. DYOR as always! 📈",
    timestamp: "8 hours ago",
    likes: 67,
    comments: 41,
    shares: 12,
    tags: ["Trading", "Analysis", "CHAIN"],
    trending: false
  }
]

// Community stats
const communityStats = {
  totalMembers: "24.8K",
  activeToday: "3.2K",
  totalPosts: "156K",
  communities: "47"
}

export default function CommunityPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = () => {
    router.push('/user/login')
  }

  const handleAdminLogin = () => {
    router.push('/malare/login')
  }

  const handleCreateCommunity = () => {
    router.push('/malare/get-started')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar Component */}
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isAuthenticated ? (
            // Not Logged In View
            <div className="text-center space-y-12">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                    ChainVerse Community
                  </h1>
                  <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                </div>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                  Join the most vibrant Web3 community where builders, traders, and innovators connect,
                  share knowledge, and shape the future of decentralized technology.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{communityStats.totalMembers}</div>
                    <div className="text-sm text-slate-400">Total Members</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-6 text-center">
                    <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{communityStats.activeToday}</div>
                    <div className="text-sm text-slate-400">Active Today</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{communityStats.totalPosts}</div>
                    <div className="text-sm text-slate-400">Total Posts</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-6 text-center">
                    <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{communityStats.communities}</div>
                    <div className="text-sm text-slate-400">Communities</div>
                  </CardContent>
                </Card>
              </div>

              {/* Call to Action */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Ready to Join the Revolution?</h2>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-8 max-w-md hover:border-cyan-400/30 transition-all duration-300 group">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <LogIn className="h-8 w-8 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Join as Member</h3>
                      <p className="text-slate-400">
                        Connect with fellow Web3 enthusiasts, share insights, and stay updated with the latest trends.
                      </p>
                      <Button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </div>
                  </Card>
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-8 max-w-md hover:border-purple-400/30 transition-all duration-300 group">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Crown className="h-8 w-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Become Community Admin</h3>
                      <p className="text-slate-400">
                        Lead your own community, moderate discussions, and help shape the Web3 ecosystem.
                      </p>
                      <Button
                        onClick={handleAdminLogin}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Login as a Community Admin / Create
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            // Logged In View
            <div className="space-y-8">
              {/* Welcome Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                    Welcome back, {user?.name}!
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Discover what's happening in the ChainVerse community
                  </p>
                </div>
                <Button
                  onClick={handleCreateCommunity}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Be a Community Admin - Create
                </Button>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-lg font-bold text-white">{communityStats.totalMembers}</div>
                        <div className="text-xs text-slate-400">Members</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-lg font-bold text-white">{communityStats.activeToday}</div>
                        <div className="text-xs text-slate-400">Active Today</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="text-lg font-bold text-white">{communityStats.totalPosts}</div>
                        <div className="text-xs text-slate-400">Posts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="text-lg font-bold text-white">{communityStats.communities}</div>
                        <div className="text-xs text-slate-400">Communities</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Community Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-cyan-400" />
                      Community Feed
                    </h2>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Live
                    </Badge>
                  </div>

                  {communityPosts.map((post) => (
                    <Card key={post.id} className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-cyan-400/30 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 border-2 border-slate-700">
                            <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-purple-600 text-slate-900 font-bold">
                              {post.author.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{post.author.name}</span>
                              <span className="text-slate-400 text-sm">@{post.author.username}</span>
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                {post.author.badge}
                              </Badge>
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                {post.author.level}
                              </Badge>
                              {post.trending && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-slate-300 leading-relaxed">{post.content}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-400/30 text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                              <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors">
                                  <Heart className="h-4 w-4" />
                                  <span className="text-sm">{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                                  <MessageCircle className="h-4 w-4" />
                                  <span className="text-sm">{post.comments}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors">
                                  <Share2 className="h-4 w-4" />
                                  <span className="text-sm">{post.shares}</span>
                                </button>
                              </div>
                              <span className="text-xs text-slate-500">{post.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Trending Topics */}
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-400" />
                        Trending Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {["DeFi", "NFTs", "Web3Gaming", "DAOs", "Layer2"].map((topic, index) => (
                        <div key={topic} className="flex items-center justify-between">
                          <span className="text-slate-300">#{topic}</span>
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                            {Math.floor(Math.random() * 100) + 50}K
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Top Contributors */}
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        Top Contributors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "CryptoSage", points: "12.5K", avatar: "/crypto-expert.png" },
                        { name: "BlockchainBob", points: "9.8K", avatar: "/blockchain-developer.png" },
                        { name: "DeFiDiva", points: "8.2K", avatar: "/defi-trader.png" }
                      ].map((contributor, index) => (
                        <div key={contributor.name} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xs font-bold">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{contributor.name}</div>
                            <div className="text-xs text-slate-400">{contributor.points} points</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
