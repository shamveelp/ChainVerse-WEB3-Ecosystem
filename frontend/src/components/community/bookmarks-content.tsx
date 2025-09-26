"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Search, Filter, Calendar, Tag, MoveHorizontal as MoreHorizontal, Trash2 } from 'lucide-react'
import Post from './post'

const bookmarkedPosts = [
  {
    id: '1',
    author: {
      name: 'Vitalik Buterin',
      username: 'vitalikbuterin',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Excited to announce the latest Ethereum improvements! Layer 2 scaling solutions are showing incredible promise. The future of DeFi is looking brighter than ever! 🚀\n\n#Ethereum #Web3 #DeFi',
    timestamp: '2h',
    likes: 2847,
    comments: 342,
    reposts: 1205,
    trending: true,
    bookmarkedAt: '2024-01-15',
    tags: ['Ethereum', 'DeFi', 'Layer2']
  },
  {
    id: '2',
    author: {
      name: 'Andre Cronje',
      username: 'andrecronje',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Deep dive into yield farming mechanisms and how to optimize for maximum returns while minimizing impermanent loss. Thread 🧵 1/12',
    timestamp: '1d',
    likes: 1234,
    comments: 156,
    reposts: 445,
    bookmarkedAt: '2024-01-14',
    tags: ['DeFi', 'YieldFarming', 'Strategy']
  },
  {
    id: '3',
    author: {
      name: 'Smart Contract Auditor',
      username: 'securityexpert',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Common smart contract vulnerabilities and how to prevent them:\n\n1. Reentrancy attacks\n2. Integer overflow/underflow\n3. Access control issues\n4. Front-running\n\nDetailed breakdown in comments 👇',
    timestamp: '3d',
    likes: 892,
    comments: 67,
    reposts: 234,
    bookmarkedAt: '2024-01-12',
    tags: ['Security', 'SmartContracts', 'Education']
  },
  {
    id: '4',
    author: {
      name: 'DeFi Protocol',
      username: 'defiprotocol',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Our comprehensive guide to liquidity mining is now live! 📚\n\nLearn how to:\n✅ Choose the right pools\n✅ Calculate APY correctly\n✅ Manage risks\n✅ Optimize gas fees\n\nBookmark this for later!',
    timestamp: '5d',
    likes: 1567,
    comments: 89,
    reposts: 456,
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800',
    bookmarkedAt: '2024-01-10',
    tags: ['DeFi', 'LiquidityMining', 'Guide']
  },
  {
    id: '5',
    author: {
      name: 'NFT Researcher',
      username: 'nftanalyst',
      avatar: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: false
    },
    content: 'The psychology behind NFT pricing: Why some JPEGs sell for millions while others can\'t find buyers at $1.\n\nA data-driven analysis of 10,000+ NFT sales reveals fascinating patterns...',
    timestamp: '1w',
    likes: 445,
    comments: 78,
    reposts: 123,
    bookmarkedAt: '2024-01-08',
    tags: ['NFT', 'Psychology', 'Analysis']
  }
]

const collections = [
  { name: 'DeFi Research', count: 12, color: 'blue' },
  { name: 'Security Tips', count: 8, color: 'red' },
  { name: 'Market Analysis', count: 15, color: 'green' },
  { name: 'NFT Insights', count: 6, color: 'purple' },
  { name: 'Tutorials', count: 23, color: 'orange' }
]

export default function BookmarksContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])

  const filters = [
    { id: 'all', label: 'All Bookmarks' },
    { id: 'recent', label: 'Recent' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'media', label: 'With Media' },
    { id: 'threads', label: 'Threads' }
  ]

  const filteredPosts = bookmarkedPosts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleDeleteSelected = () => {
    // Handle deleting selected bookmarks
    console.log('Deleting bookmarks:', selectedPosts)
    setSelectedPosts([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Bookmarks</h2>
          </div>
          {selectedPosts.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{selectedPosts.length} selected</span>
              <Button
                onClick={handleDeleteSelected}
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className={`flex-1 ${
                selectedFilter === filter.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Collections */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Collections</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {collections.map((collection, index) => (
              <Button
                key={index}
                variant="outline"
                className={`border-slate-600 hover:bg-slate-700/50 ${
                  collection.color === 'blue' ? 'hover:border-blue-400/30 hover:text-blue-400' :
                  collection.color === 'red' ? 'hover:border-red-400/30 hover:text-red-400' :
                  collection.color === 'green' ? 'hover:border-green-400/30 hover:text-green-400' :
                  collection.color === 'purple' ? 'hover:border-purple-400/30 hover:text-purple-400' :
                  'hover:border-orange-400/30 hover:text-orange-400'
                }`}
              >
                {collection.name}
                <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                  {collection.count}
                </Badge>
              </Button>
            ))}
          </div>
        </Card>

        {/* Bookmarked Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg p-2">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => handleSelectPost(post.id)}
                    className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Post {...post} />
              
              {/* Bookmark Info */}
              <div className="mt-2 px-6 pb-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Bookmarked on {post.bookmarkedAt}</span>
                  </div>
                  {post.tags && (
                    <div className="flex items-center gap-2">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-slate-700 text-slate-400 text-xs px-2 py-0.5"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-lg text-slate-400">No bookmarks found</p>
            <p className="text-sm text-slate-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Bookmark posts to read them later'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}