"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Users, Star } from 'lucide-react'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

const searchHistory = [
  '#DeFi', '#NFTCollection', 'Ethereum 2.0', 'Smart Contracts', '#Web3Gaming'
]

const trendingTopics = [
  { tag: '#EthereumMerge', posts: '125K', trend: 'trending' },
  { tag: '#DeFiYield', posts: '89K', trend: 'hot' },
  { tag: '#NFTDrop', posts: '67K', trend: 'trending' },
  { tag: '#Web3Gaming', posts: '45K', trend: 'rising' },
  { tag: '#DAOGovernance', posts: '34K', trend: 'hot' },
  { tag: '#Layer2Solutions', posts: '23K', trend: 'rising' }
]

const popularCommunities = [
  {
    name: 'DeFi Builders United',
    members: '45.2K',
    avatar: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Building the future of decentralized finance',
    category: 'Development',
    verified: true,
    growth: '+12%'
  },
  {
    name: 'NFT Art Collective',
    members: '32.8K',
    avatar: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Where digital art meets blockchain technology',
    category: 'Art & Design',
    growth: '+8%'
  },
  {
    name: 'Crypto Trading Masters',
    members: '67.1K',
    avatar: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Advanced trading strategies and market analysis',
    category: 'Trading',
    verified: true,
    growth: '+15%'
  }
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'communities', label: 'Communities' },
    { id: 'trending', label: 'Trending' },
    { id: 'people', label: 'People' }
  ]

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <h2 className="text-2xl font-bold text-white mb-4">Explore</h2>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search Web3 communities, topics, and people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400 h-12"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex-1 ${
                      activeFilter === filter.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="px-4 space-y-6 pb-6">
              {/* Search History */}
              {!searchQuery && (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-white">Recent Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((query, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(query)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Trending Topics */}
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-bold text-white">Trending Now</h3>
                </div>
                <div className="space-y-3">
                  {trendingTopics.map((topic) => (
                    <div key={topic.tag} className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-cyan-400 font-semibold group-hover:text-cyan-300">
                              {topic.tag}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                topic.trend === 'trending' ? 'border-orange-500/30 text-orange-400' :
                                topic.trend === 'hot' ? 'border-red-500/30 text-red-400' :
                                'border-green-500/30 text-green-400'
                              }`}
                            >
                              {topic.trend}
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-sm">{topic.posts} posts</p>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Follow
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Popular Communities */}
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Popular Communities</h3>
                </div>
                <div className="space-y-4">
                  {popularCommunities.map((community) => (
                    <div key={community.name} className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-14 h-14 ring-2 ring-slate-700/50">
                          <AvatarImage src={community.avatar} alt={community.name} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                            {community.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white group-hover:text-cyan-300">
                                {community.name}
                              </h4>
                              {community.verified && (
                                <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                              {community.growth}
                            </Badge>
                          </div>

                          <p className="text-slate-400 text-sm mb-2">{community.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>{community.members} members</span>
                              <Badge variant="outline" className="border-slate-600 text-slate-400">
                                {community.category}
                              </Badge>
                            </div>
                            <Button size="sm" variant="outline" className="border-slate-600 hover:bg-purple-500/20 hover:border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Join
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}