"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Search, Filter, MoveHorizontal as MoreHorizontal, Crown, Shield, UserPlus, Mail, Calendar, Activity, TrendingUp, UserMinus, MessageSquare, Award } from 'lucide-react'

const mockMembers = [
  {
    id: 1,
    name: "Alice Johnson",
    username: "@alice_defi",
    email: "alice@example.com",
    avatar: "A",
    role: "Premium",
    joinDate: "Dec 15, 2024",
    lastActive: "2 hours ago",
    questsCompleted: 12,
    postsCount: 45,
    status: "active"
  },
  {
    id: 2,
    name: "Bob Smith",
    username: "@cryptobob",
    email: "bob@example.com", 
    avatar: "B",
    role: "Member",
    joinDate: "Dec 10, 2024",
    lastActive: "1 day ago",
    questsCompleted: 8,
    postsCount: 23,
    status: "active"
  },
  {
    id: 3,
    name: "Carol Davis",
    username: "@carol_nft",
    email: "carol@example.com",
    avatar: "C", 
    role: "Premium",
    joinDate: "Dec 5, 2024",
    lastActive: "3 hours ago",
    questsCompleted: 15,
    postsCount: 67,
    status: "active"
  },
  {
    id: 4,
    name: "David Wilson",
    username: "@david_dao",
    email: "david@example.com",
    avatar: "D",
    role: "Member",
    joinDate: "Nov 28, 2024", 
    lastActive: "1 week ago",
    questsCompleted: 3,
    postsCount: 8,
    status: "inactive"
  },
]

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || member.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getMemberStats = () => {
    return {
      total: mockMembers.length,
      active: mockMembers.filter(m => m.status === 'active').length,
      premium: mockMembers.filter(m => m.role === 'Premium').length,
      newThisWeek: 5
    }
  }

  const stats = getMemberStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Member Management
          </h1>
          <p className="text-gray-400 mt-2">Manage and engage with your community members</p>
        </div>
        <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Premium Members</p>
                <p className="text-2xl font-bold text-white">{stats.premium}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">New This Week</p>
                <p className="text-2xl font-bold text-white">{stats.newThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-red-400" />
              Community Members
            </CardTitle>
            <div className="flex gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                />
              </div>
              
              {/* Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 bg-red-950/20 border-red-800/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-red-800/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-red-950/20 border-red-800/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-red-800/30">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most-active">Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-red-950/20 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{member.name}</h4>
                      <span className="text-sm text-gray-400">{member.username}</span>
                      {member.role === 'Premium' && (
                        <Crown className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{member.email}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {member.joinDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Active {member.lastActive}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-white">{member.questsCompleted}</p>
                      <p className="text-gray-400 text-xs">Quests</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white">{member.postsCount}</p>
                      <p className="text-gray-400 text-xs">Posts</p>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge 
                    variant={member.status === 'active' ? 'default' : 'outline'}
                    className={member.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'border-gray-600 text-gray-400'
                    }
                  >
                    {member.status}
                  </Badge>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-red-950/30">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black border-red-800/30">
                      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-red-950/30">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-red-950/30">
                        <Award className="h-4 w-4 mr-2" />
                        Award Badge
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-red-950/30">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No members found matching your search criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-red-800/20">
              <p className="text-sm text-gray-400">
                Showing {filteredMembers.length} of {mockMembers.length} members
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}