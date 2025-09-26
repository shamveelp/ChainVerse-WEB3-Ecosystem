"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Star, Calendar, MessageCircle, TrendingUp, Settings, Search, Plus } from 'lucide-react'

const joinedCommunities = [
  {
    id: '1',
    name: 'DeFi Protocol Builders',
    members: '45.2K',
    avatar: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Building the future of decentralized finance with cutting-edge protocols',
    category: 'Development',
    verified: true,
    role: 'Member',
    joinedDate: '2023-12-15',
    lastActive: '2h',
    notifications: true,
    unreadPosts: 12,
    trending: true
  },
  {
    id: '2',
    name: 'NFT Artists Collective',
    members: '32.8K',
    avatar: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Where digital art meets blockchain technology',
    category: 'Art & Design',
    verified: false,
    role: 'Moderator',
    joinedDate: '2023-11-20',
    lastActive: '5h',
    notifications: true,
    unreadPosts: 8,
    trending: false
  },
  {
    id: '3',
    name: 'Smart Contract Security',
    members: '18.4K',
    avatar: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Auditing and securing the Web3 ecosystem',
    category: 'Security',
    verified: true,
    role: 'Member',
    joinedDate: '2023-10-10',
    lastActive: '1d',
    notifications: false,
    unreadPosts: 0,
    trending: false
  },
  {
    id: '4',
    name: 'Crypto Trading Hub',
    members: '67.1K',
    avatar: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Advanced trading strategies and market analysis',
    category: 'Trading',
    verified: true,
    role: 'VIP Member',
    joinedDate: '2023-09-05',
    lastActive: '30m',
    notifications: true,
    unreadPosts: 24,
    trending: true
  },
  {
    id: '5',
    name: 'Web3 Gaming Alliance',
    members: '28.9K',
    avatar: 'https://images.pexels.com/photos/159775/pexels-photo-159775.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Building the future of gaming on blockchain',
    category: 'Gaming',
    verified: false,
    role: 'Member',
    joinedDate: '2023-08-15',
    lastActive: '3d',
    notifications: false,
    unreadPosts: 3,
    trending: false
  },
  {
    id: '6',
    name: 'DAO Governance Experts',
    members: '15.7K',
    avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Decentralized governance and voting mechanisms',
    category: 'Governance',
    verified: true,
    role: 'Council Member',
    joinedDate: '2023-07-20',
    lastActive: '6h',
    notifications: true,
    unreadPosts: 7,
    trending: false
  }
]

const communityStats = {
  totalCommunities: joinedCommunities.length,
  totalMembers: joinedCommunities.reduce((sum, c) => sum + parseFloat(c.members.replace('K', '')) * 1000, 0),
  unreadPosts: joinedCommunities.reduce((sum, c) => sum + c.unreadPosts, 0),
  moderatedCommunities: joinedCommunities.filter(c => c.role === 'Moderator' || c.role === 'Council Member').length
}

export default function CommunitiesContent() {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const filters = [
    { id: 'all', label: 'All Communities' },
    { id: 'active', label: 'Active' },
    { id: 'moderated', label: 'Moderated' },
    { id: 'trending', label: 'Trending' }
  ]

  const sortOptions = [
    { id: 'recent', label: 'Recent Activity' },
    { id: 'alphabetical', label: 'A-Z' },
    { id: 'members', label: 'Member Count' },
    { id: 'joined', label: 'Date Joined' }
  ]

  const filteredCommunities = joinedCommunities.filter(community => {
    if (filter === 'active') return community.unreadPosts > 0
    if (filter === 'moderated') return community.role === 'Moderator' || community.role === 'Council Member'
    if (filter === 'trending') return community.trending
    return true
  })

  const sortedCommunities = [...filteredCommunities].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'members':
        return parseFloat(b.members) - parseFloat(a.members)
      case 'joined':
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
      default: // recent
        return new Date(`2024-01-01 ${a.lastActive === '30m' ? '23:30' : a.lastActive === '2h' ? '22:00' : '12:00'}`).getTime() - 
               new Date(`2024-01-01 ${b.lastActive === '30m' ? '23:30' : b.lastActive === '2h' ? '22:00' : '12:00'}`).getTime()
    }
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Moderator':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Moderator</Badge>
      case 'Council Member':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Council</Badge>
      case 'VIP Member':
        return <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border-pink-500/30">VIP</Badge>
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">Member</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">My Communities</h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="border-slate-600 text-slate-400 hover:text-white">
              <Search className="h-4 w-4" />
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{communityStats.totalCommunities}</p>
            <p className="text-sm text-slate-400">Communities</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{Math.round(communityStats.totalMembers / 1000)}K+</p>
            <p className="text-sm text-slate-400">Total Members</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{communityStats.unreadPosts}</p>
            <p className="text-sm text-slate-400">Unread Posts</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{communityStats.moderatedCommunities}</p>
            <p className="text-sm text-slate-400">Moderated</p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1 flex-1">
            {filters.map((filterItem) => (
              <Button
                key={filterItem.id}
                variant={filter === filterItem.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(filterItem.id)}
                className={`flex-1 text-sm ${
                  filter === filterItem.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterItem.label}
              </Button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {sortedCommunities.map((community) => (
          <Card 
            key={community.id} 
            className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 cursor-pointer p-6"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-2 ring-slate-700/50">
                  <AvatarImage src={community.avatar} alt={community.name} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    {community.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {community.trending && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white hover:text-cyan-300 transition-colors">
                        {community.name}
                      </h3>
                      {community.verified && (
                        <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{community.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 mb-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{community.members} members</span>
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {community.category}
                  </Badge>
                  {getRoleBadge(community.role)}
                  <span>Last active: {community.lastActive}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {community.unreadPosts > 0 && (
                      <div className="flex items-center gap-1 text-cyan-400">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{community.unreadPosts} new posts</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-sm ${
                        community.notifications 
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {community.notifications ? 'Notifications On' : 'Notifications Off'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700/50">
                      View Posts
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
                      Open Community
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {sortedCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-lg text-slate-400">No communities found</p>
            <p className="text-sm text-slate-500 mb-4">Try adjusting your filters or join some communities</p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Discover Communities
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}