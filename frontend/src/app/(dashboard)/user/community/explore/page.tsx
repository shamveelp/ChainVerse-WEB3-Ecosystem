"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Users, Star, Hash, ExternalLink, Loader2 } from 'lucide-react'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { 
  communityExploreApiService, 
  type Community, 
  type UserSearchResult,
  type SearchResponse 
} from '@/services/userCommunityServices/communityExploreApiService'
import { toast } from 'sonner'

const searchHistory = [
  '#DeFi', '#NFTCollection', 'Ethereum 2.0', 'Smart Contracts', '#Web3Gaming'
]

const trendingTopics = [
  { tag: '#EthereumMerge', posts: '125K', trend: 'trending' as const },
  { tag: '#DeFiYield', posts: '89K', trend: 'hot' as const },
  { tag: '#NFTDrop', posts: '67K', trend: 'trending' as const },
  { tag: '#Web3Gaming', posts: '45K', trend: 'rising' as const },
  { tag: '#DAOGovernance', posts: '34K', trend: 'hot' as const },
  { tag: '#Layer2Solutions', posts: '23K', trend: 'rising' as const }
]

export default function ExplorePage() {
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([])
  const [loadingPopular, setLoadingPopular] = useState(true)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'communities', label: 'Communities' },
    { id: 'users', label: 'People' }
  ]

  // Load popular communities on mount
  useEffect(() => {
    const loadPopularCommunities = async () => {
      try {
        setLoadingPopular(true)
        const response = await communityExploreApiService.getPopularCommunities(undefined, 10)
        setPopularCommunities(response.communities)
      } catch (error: any) {
        console.error('Failed to load popular communities:', error)
        toast.error('Failed to load popular communities')
      } finally {
        setLoadingPopular(false)
      }
    }

    loadPopularCommunities()
  }, [])

  // Handle search with debouncing
  const performSearch = useCallback(async (query: string, type: string) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    try {
      setSearching(true)
      const results = await communityExploreApiService.search(query.trim(), type, undefined, 20)
      setSearchResults(results)
    } catch (error: any) {
      console.error('Search failed:', error)
      toast.error('Search failed', {
        description: error.message || 'Please try again'
      })
      setSearchResults(null)
    } finally {
      setSearching(false)
    }
  }, [])

  // Effect to handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery, activeFilter)
      } else {
        setSearchResults(null)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeFilter, performSearch])

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId)
    if (searchQuery.trim()) {
      performSearch(searchQuery, filterId)
    }
  }

  // Handle search history click
  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query)
  }

  // Handle community click
  const handleCommunityClick = (community: Community) => {
    router.push(`/user/community/c/${community.username}`)
  }

  // Handle user click
  const handleUserClick = (user: UserSearchResult) => {
    router.push(`/user/community/${user.username}`)
  }

  // Handle join/leave community
  const handleCommunityAction = async (community: Community, action: 'join' | 'leave') => {
    if (!currentUser) {
      toast.error('Please login to join communities')
      router.push('/auth/login')
      return
    }

    try {
      if (action === 'join') {
        await communityExploreApiService.joinCommunity(community.username)
        toast.success(`Joined ${community.communityName}`)
      } else {
        await communityExploreApiService.leaveCommunity(community.username)
        toast.success(`Left ${community.communityName}`)
      }

      // Update search results if showing
      if (searchResults) {
        setSearchResults(prev => prev ? {
          ...prev,
          communities: prev.communities.map(c => 
            c._id === community._id 
              ? { ...c, isMember: action === 'join', memberCount: action === 'join' ? c.memberCount + 1 : Math.max(0, c.memberCount - 1) }
              : c
          )
        } : null)
      }

      // Update popular communities if showing
      setPopularCommunities(prev => 
        prev.map(c => 
          c._id === community._id 
            ? { ...c, isMember: action === 'join', memberCount: action === 'join' ? c.memberCount + 1 : Math.max(0, c.memberCount - 1) }
            : c
        )
      )
    } catch (error: any) {
      console.error(`${action} community error:`, error)
      toast.error(`Failed to ${action} community`, {
        description: error.message || 'Please try again'
      })
    }
  }

  const renderCommunityCard = (community: Community, showJoinButton: boolean = true) => (
    <div 
      key={community._id} 
      className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50"
      onClick={() => handleCommunityClick(community)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 ring-2 ring-slate-700/50 flex-shrink-0">
          <AvatarImage src={community.logo} alt={community.communityName} />
          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            {communityExploreApiService.getCommunityAvatarFallback(community.communityName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-semibold text-white group-hover:text-cyan-300 truncate">
                {community.communityName}
              </h4>
              {community.isVerified && (
                <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-2 line-clamp-2">{community.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{communityExploreApiService.formatMemberCount(community.memberCount)} members</span>
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                <Hash className="w-3 h-3 mr-1" />
                {community.category}
              </Badge>
            </div>
            {showJoinButton && currentUser && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleCommunityAction(community, community.isMember ? 'leave' : 'join')
                }}
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  community.isMember
                    ? 'border-slate-600 hover:bg-red-600/20 hover:border-red-400 hover:text-red-400'
                    : 'border-slate-600 hover:bg-purple-500/20 hover:border-purple-400'
                }`}
              >
                {community.isMember ? 'Leave' : 'Join'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderUserCard = (user: UserSearchResult) => (
    <div 
      key={user._id}
      className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50"
      onClick={() => handleUserClick(user)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 ring-2 ring-slate-700/50 flex-shrink-0">
          <AvatarImage src={user.profilePic} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-semibold text-white group-hover:text-cyan-300 truncate">
                {user.name}
              </h4>
              {user.isVerified && (
                <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-1">@{user.username}</p>
          {user.bio && <p className="text-slate-400 text-sm mb-2 line-clamp-2">{user.bio}</p>}

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              <span>{communityExploreApiService.formatMemberCount(user.followersCount)} followers</span>
            </div>
            {currentUser && currentUser.username !== user.username && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle follow/unfollow logic here
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity border-slate-600 hover:bg-purple-500/20 hover:border-purple-400"
              >
                {user.isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

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
                  placeholder="Search Web3 communities and people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400 h-12"
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleFilterChange(filter.id)}
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
              {/* Search Results */}
              {searchQuery.trim() && searchResults && (
                <div className="space-y-6">
                  {/* Communities Results */}
                  {searchResults.communities.length > 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Hash className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Communities</h3>
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                          {searchResults.communities.length}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {searchResults.communities.map(community => renderCommunityCard(community))}
                      </div>
                    </Card>
                  )}

                  {/* Users Results */}
                  {searchResults.users.length > 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">People</h3>
                        <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400">
                          {searchResults.users.length}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {searchResults.users.map(user => renderUserCard(user))}
                      </div>
                    </Card>
                  )}

                  {/* No Results */}
                  {searchResults.communities.length === 0 && searchResults.users.length === 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-12">
                      <div className="text-center">
                        <Search className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-lg text-slate-400">No results found</p>
                        <p className="text-sm text-slate-500">Try different keywords or browse popular communities</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

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
                        onClick={() => handleSearchHistoryClick(query)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Trending Topics */}
              {!searchQuery && (
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
              )}

              {/* Popular Communities */}
              {!searchQuery && (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Popular Communities</h3>
                  </div>
                  
                  {loadingPopular ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {popularCommunities.map(community => renderCommunityCard(community))}
                    </div>
                  )}
                </Card>
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