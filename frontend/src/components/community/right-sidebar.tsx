"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Star, Plus } from 'lucide-react'

const trendingTopics = [
  { tag: '#DeFi', posts: '45.2K' },
  { tag: '#NFTs', posts: '32.1K' },
  { tag: '#Ethereum', posts: '28.7K' },
  { tag: '#Bitcoin', posts: '67.3K' }
]

const suggestedCommunities = [
  {
    name: 'DeFi Protocol Builders',
    members: '12.4K',
    avatar: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true
  },
  {
    name: 'NFT Artists Collective',
    members: '8.7K',
    avatar: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=100'
  }
]

const whoToFollow = [
  {
    name: 'Ethereum Foundation',
    username: 'ethereum',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true
  },
  {
    name: 'OpenSea',
    username: 'opensea',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true
  }
]

export default function RightSidebar() {
  const [followedUsers, setFollowedUsers] = useState<string[]>([])

  const handleFollow = (username: string) => {
    setFollowedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    )
  }

  return (
    <aside className="hidden xl:block fixed right-0 top-0 w-72 border-l border-slate-700/50 bg-slate-950 h-screen z-30">
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        <div className="p-3 space-y-4">
          
          {/* Trending Topics */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <h3 className="text-base font-semibold text-white">Trending</h3>
              </div>
              <div className="space-y-2">
                {trendingTopics.map((topic) => (
                  <div key={topic.tag} className="hover:bg-slate-800/30 rounded-md p-2 cursor-pointer">
                    <p className="text-cyan-400 text-sm font-medium">{topic.tag}</p>
                    <p className="text-slate-500 text-xs">{topic.posts} posts</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Suggested Communities */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Communities</h3>
              </div>
              <div className="space-y-2">
                {suggestedCommunities.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 hover:bg-slate-800/30 rounded-md p-2 cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.avatar} alt={c.name} />
                      <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.members} members</p>
                    </div>
                    <Button size="sm" className="text-xs px-2 py-1">Join</Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Who to Follow */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">Who to Follow</h3>
              </div>
              <div className="space-y-2">
                {whoToFollow.map((u) => (
                  <div key={u.username} className="flex items-center gap-2 hover:bg-slate-800/30 rounded-md p-2 cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs px-2 py-1"
                      variant={followedUsers.includes(u.username) ? "secondary" : "outline"}
                      onClick={() => handleFollow(u.username)}
                    >
                      {followedUsers.includes(u.username) ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Create Community CTA (Optional) */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/20">
            <div className="p-3 text-center">
              <Plus className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">Start a Community</h3>
              <h5 className="text-xs text-white mb-1">Be a Community Admin</h5>
              <Button size="sm" className="w-full text-xs py-1 bg-gradient-to-r from-purple-500 to-pink-600">
                Create
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </aside>
  )
}
