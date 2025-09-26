"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Search, Calendar, Tag, MoveHorizontal as MoreHorizontal, Trash2 } from 'lucide-react'
import Post from '@/components/community/post'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

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
  }
]

export default function BookmarksPage() {
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

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleDeleteSelected = () => {
    console.log('Deleting bookmarks:', selectedPosts)
    setSelectedPosts([])
  }

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

            <div className="px-4 space-y-6 pb-6">
              {/* Bookmarked Posts */}
              <div className="space-y-6">
                {bookmarkedPosts.map((post) => (
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

              {bookmarkedPosts.length === 0 && (
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
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}