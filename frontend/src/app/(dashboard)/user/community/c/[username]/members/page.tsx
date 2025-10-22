// frontend/src/app/(dashboard)/user/community/c/[username]/members/page.tsx
"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Loader2, 
  AlertCircle,
  Crown,
  Shield,
  User,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Heart,
  Hash
} from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { toast } from 'sonner'
import { 
  communityExploreApiService, 
  type CommunityMember,
  type CommunityMemberListResponse 
} from '@/services/userCommunityServices/communityExploreApiService'

interface CommunityMembersPageProps {
  params: Promise<{
    username: string
  }>
}

export default function CommunityMembersPage({ params }: CommunityMembersPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username: communityUsername } = resolvedParams

  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredMembers, setFilteredMembers] = useState<CommunityMember[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [totalCount, setTotalCount] = useState(0)

  // Get current user info
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const filters = [
    { id: 'all', label: 'All Members', icon: Users },
    { id: 'admin', label: 'Admins', icon: Crown },
    { id: 'moderator', label: 'Moderators', icon: Shield },
    { id: 'member', label: 'Members', icon: User }
  ]

  // Fetch members data
  const fetchMembers = async (cursor?: string, reset: boolean = false) => {
    if (!communityUsername) return

    try {
      if (reset) {
        setLoading(true)
        setMembers([])
      } else {
        setLoadingMore(true)
      }
      
      setError(null)
      
      console.log('Fetching members for community:', communityUsername, 'cursor:', cursor)
      const response: CommunityMemberListResponse = await communityExploreApiService.getCommunityMembers(
        communityUsername,
        cursor,
        20
      )
      
      if (reset) {
        setMembers(response.members)
      } else {
        setMembers(prev => [...prev, ...response.members])
      }
      
      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)
      setTotalCount(response.totalCount)
      
      console.log('Members loaded:', response.members.length, 'Total:', response.totalCount)
    } catch (err: any) {
      console.error('Failed to fetch members:', err)
      setError(err.message || 'Failed to load community members')
      toast.error('Failed to load members', {
        description: err.message || 'Please try again'
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchMembers(undefined, true)
  }, [communityUsername])

  // Filter and search members
  useEffect(() => {
    let filtered = members

    // Apply role filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(member => member.role === activeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(member => 
        member.user.username.toLowerCase().includes(query) ||
        member.user.name.toLowerCase().includes(query)
      )
    }

    setFilteredMembers(filtered)
  }, [members, activeFilter, searchQuery])

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      fetchMembers(nextCursor, false)
    }
  }

  // Handle member click (navigate to profile)
  const handleMemberClick = (member: CommunityMember) => {
    router.push(`/user/community/${member.user.username}`)
  }

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case 'moderator':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
            <User className="w-3 h-3 mr-1" />
            Member
          </Badge>
        )
    }
  }

  // Format join date
  const formatJoinDate = (dateString: Date) => {
    return communityExploreApiService.formatDateLong(dateString)
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading members...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  // Show error
  if (error && members.length === 0) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-slate-400">{error}</p>
                <Button
                  onClick={() => fetchMembers(undefined, true)}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-hidden">
          <div className="space-y-0">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-white">Members</h2>
                  <p className="text-slate-400">
                    {communityExploreApiService.formatMemberCount(totalCount)} members
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1 overflow-x-auto">
                {filters.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex-shrink-0 ${
                        activeFilter === filter.id
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {filter.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Members List */}
            <div className="p-4 space-y-4">
              {filteredMembers.length === 0 ? (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-12">
                  <div className="text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg text-slate-400">
                      {searchQuery.trim() ? 'No members found' : 'No members yet'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {searchQuery.trim() 
                        ? 'Try different search terms' 
                        : 'Members will appear here when they join'
                      }
                    </p>
                  </div>
                </Card>
              ) : (
                <>
                  {filteredMembers.map((member) => (
                    <Card
                      key={member._id}
                      className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 cursor-pointer p-4"
                      onClick={() => handleMemberClick(member)}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-slate-700/50 flex-shrink-0">
                          <AvatarImage
                            src={member.user.profilePic}
                            alt={member.user.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                            {communityExploreApiService.getUserAvatarFallback(
                              member.user.name,
                              member.user.username
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white truncate hover:text-cyan-300 transition-colors">
                                  {member.user.name || member.user.username}
                                </h4>
                                {member.user.isVerified && (
                                  <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm truncate">@{member.user.username}</p>
                            </div>
                            {getRoleBadge(member.role)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {formatJoinDate(member.joinedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              <span>{member.totalPosts} posts</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{member.totalLikes} likes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{member.totalComments} comments</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center py-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                      >
                        {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Load More Members
                      </Button>
                    </div>
                  )}
                </>
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
