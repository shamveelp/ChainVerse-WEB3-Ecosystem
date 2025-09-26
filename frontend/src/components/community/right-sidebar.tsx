"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Star, Calendar, ExternalLink, Plus } from 'lucide-react'

const trendingTopics = [
  { tag: '#DeFi', posts: '45.2K', change: '+12%' },
  { tag: '#NFTs', posts: '32.1K', change: '+8%' },
  { tag: '#Ethereum', posts: '28.7K', change: '+15%' },
  { tag: '#Bitcoin', posts: '67.3K', change: '+5%' },
  { tag: '#Web3Gaming', posts: '19.4K', change: '+22%' }
]

const suggestedCommunities = [
  {
    name: 'DeFi Protocol Builders',
    members: '12.4K',
    avatar: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100',
    category: 'Development',
    verified: true
  },
  {
    name: 'NFT Artists Collective',
    members: '8.7K',
    avatar: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=100',
    category: 'Art & Design'
  },
  {
    name: 'Crypto Trading Hub',
    members: '23.1K',
    avatar: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=100',
    category: 'Trading',
    verified: true
  },
  {
    name: 'Blockchain Researchers',
    members: '5.2K',
    avatar: 'https://images.pexels.com/photos/159775/pexels-photo-159775.jpeg?auto=compress&cs=tinysrgb&w=100',
    category: 'Research'
  }
]

const upcomingEvents = [
  {
    title: 'DeFi Summit 2024',
    date: 'Mar 15',
    time: '10:00 AM',
    attendees: 2847,
    type: 'Virtual'
  },
  {
    title: 'NFT Marketplace Launch',
    date: 'Mar 18',
    time: '2:00 PM',
    attendees: 1245,
    type: 'Hybrid'
  },
  {
    title: 'Smart Contract Workshop',
    date: 'Mar 22',
    time: '6:00 PM',
    attendees: 567,
    type: 'In-Person'
  }
]

const whoToFollow = [
  {
    name: 'Ethereum Foundation',
    username: 'ethereum',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true,
    followers: '2.1M'
  },
  {
    name: 'OpenSea',
    username: 'opensea',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true,
    followers: '945K'
  },
  {
    name: 'Polygon',
    username: 'polygon',
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true,
    followers: '1.3M'
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
    <aside className="hidden xl:block w-80 border-l border-slate-700/50 bg-slate-950">
      <div className="sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        <div className="p-4 space-y-6">
          {/* Trending Topics */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">Trending in Web3</h3>
              </div>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.tag} className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-2 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-cyan-400 font-semibold group-hover:text-cyan-300">
                          {topic.tag}
                        </p>
                        <p className="text-slate-500 text-sm">{topic.posts} posts</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                        {topic.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3 text-cyan-400 hover:text-cyan-300">
                Show more
              </Button>
            </div>
          </Card>

          {/* Suggested Communities */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Suggested Communities</h3>
              </div>
              <div className="space-y-3">
                {suggestedCommunities.map((community, index) => (
                  <div key={community.name} className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs">
                          {community.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-white truncate text-sm">{community.name}</p>
                          {community.verified && (
                            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-400 text-xs">{community.members} members</p>
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-slate-600 text-slate-300">
                            {community.category}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-600 hover:bg-purple-500/20 hover:border-purple-400 text-xs">
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Upcoming Events</h3>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={event.title} className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-white text-sm group-hover:text-cyan-300">{event.title}</p>
                      <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs">{event.date} • {event.time}</p>
                        <p className="text-slate-500 text-xs">{event.attendees} attending</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${
                          event.type === 'Virtual' ? 'border-blue-500/30 text-blue-400' :
                          event.type === 'Hybrid' ? 'border-purple-500/30 text-purple-400' :
                          'border-green-500/30 text-green-400'
                        }`}
                      >
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Who to Follow */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Who to Follow</h3>
              </div>
              <div className="space-y-3">
                {whoToFollow.map((user, index) => (
                  <div key={user.username} className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-white truncate text-sm">{user.name}</p>
                          {user.verified && (
                            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-400 text-xs">@{user.username}</p>
                          <p className="text-slate-500 text-xs">{user.followers} followers</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={followedUsers.includes(user.username) ? "secondary" : "outline"}
                        onClick={() => handleFollow(user.username)}
                        className="border-slate-600 hover:bg-cyan-500/20 hover:border-cyan-400 text-xs"
                      >
                        {followedUsers.includes(user.username) ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Create Community CTA */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm border-purple-500/30">
            <div className="p-4 text-center">
              <Plus className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Start Your Community</h3>
              <p className="text-slate-300 text-sm mb-4">
                Build and grow your own Web3 community with powerful tools and insights.
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white">
                Create Community
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </aside>
  )
}