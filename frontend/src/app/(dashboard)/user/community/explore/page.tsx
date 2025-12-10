"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Users, Hash, ExternalLink, Loader2, X } from 'lucide-react'
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
import { USER_ROUTES } from '@/routes'

// Search history management
const SEARCH_HISTORY_KEY = 'communitySearchHistory'
const MAX_SEARCH_HISTORY = 10

const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const addToSearchHistory = (query: string) => {
  if (!query.trim() || typeof window === 'undefined') return

  try {
    const history = getSearchHistory()
    const updatedHistory = [
      query.trim(),
      ...history.filter(item => item !== query.trim())
    ].slice(0, MAX_SEARCH_HISTORY)

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

const clearSearchHistory = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}

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
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Pagination for search results
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchCursor, setSearchCursor] = useState<string | undefined>()
  const [loadingMoreSearch, setLoadingMoreSearch] = useState(false)

  // Pagination for popular communities
  const [popularHasMore, setPopularHasMore] = useState(false)
  const [popularCursor, setPopularCursor] = useState<string | undefined>()
  const [loadingMorePopular, setLoadingMorePopular] = useState(false)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'communities', label: 'Communities' },
    { id: 'users', label: 'People' }
  ]

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Load popular communities on mount
  useEffect(() => {
    const loadPopularCommunities = async () => {
      try {
        setLoadingPopular(true)
        const response = await communityExploreApiService.getPopularCommunities(undefined, 4)
        setPopularCommunities(response.communities)
        setPopularHasMore(response.hasMore)
        setPopularCursor(response.nextCursor)
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
  const performSearch = useCallback(async (query: string, type: string, cursor?: string, reset: boolean = true) => {
    if (!query.trim()) {
      setSearchResults(null)
      setSearchHasMore(false)
      setSearchCursor(undefined)
      return
    }

    try {
      if (reset) {
        setSearching(true)
        setSearchResults(null)
      } else {
        setLoadingMoreSearch(true)
      }

      const results = await communityExploreApiService.search(query.trim(), type, cursor, 4)

      if (reset) {
        setSearchResults(results)
        setSearchHasMore(results.hasMore)
        setSearchCursor(results.nextCursor)
        // Add to search history only for new searches
        addToSearchHistory(query.trim())
        setSearchHistory(getSearchHistory())
      } else {
        // Append results for load more
        setSearchResults(prev => prev ? {
          ...results,
          communities: [...prev.communities, ...results.communities],
          users: [...prev.users, ...results.users]
        } : results)
        setSearchHasMore(results.hasMore)
        setSearchCursor(results.nextCursor)
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      toast.error('Search failed', {
        description: error.message || 'Please try again'
      })
      if (reset) {
        setSearchResults(null)
      }
    } finally {
      setSearching(false)
      setLoadingMoreSearch(false)
    }
  }, [])

  // Effect to handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery, activeFilter, undefined, true)
      } else {
        setSearchResults(null)
        setSearchHasMore(false)
        setSearchCursor(undefined)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeFilter, performSearch])

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId)
    if (searchQuery.trim()) {
      performSearch(searchQuery, filterId, undefined, true)
    }
  }

  // Handle search history click
  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query)
  }

  // Handle clear search history
  const handleClearSearchHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    toast.success('Search history cleared')
  }

  // Handle remove search history item
  const handleRemoveSearchHistoryItem = (query: string) => {
    const updatedHistory = searchHistory.filter(item => item !== query)
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
      setSearchHistory(updatedHistory)
    } catch (error) {
      console.error('Failed to update search history:', error)
    }
  }

  // Handle community click
  const handleCommunityClick = (community: Community) => {
    router.push(`${USER_ROUTES.COMMUNITY_DETAIL}/${community.username}`)
  }

  // Handle user click
  const handleUserClick = (user: UserSearchResult) => {
    router.push(`${USER_ROUTES.COMMUNITY}/${user.username}`)
  }

  // Handle load more search results
  const handleLoadMoreSearch = () => {
    if (searchHasMore && !loadingMoreSearch && searchCursor && searchQuery.trim()) {
      performSearch(searchQuery, activeFilter, searchCursor, false)
    }
  }

  // Handle load more popular communities
  const handleLoadMorePopular = async () => {
    if (!popularHasMore || loadingMorePopular || !popularCursor) return

    try {
      setLoadingMorePopular(true)
      const response = await communityExploreApiService.getPopularCommunities(popularCursor, 4)
      setPopularCommunities(prev => [...prev, ...response.communities])
      setPopularHasMore(response.hasMore)
      setPopularCursor(response.nextCursor)
    } catch (error: any) {
      console.error('Failed to load more popular communities:', error)
      toast.error('Failed to load more communities')
    } finally {
      setLoadingMorePopular(false)
    }
  }

  // Handle join/leave community
  const handleCommunityAction = async (community: Community, action: 'join' | 'leave') => {
    if (!currentUser) {
      toast.error('Please login to join communities')
      router.push(USER_ROUTES.LOGIN)
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

      // Update popular communities
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
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${community.isMember
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
                    className={`flex-1 ${activeFilter === filter.id
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
                          {searchResults.communities.length}{searchResults.totalCount > searchResults.communities.length && '+'}
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
                          {searchResults.users.length}{searchResults.totalCount > searchResults.users.length && '+'}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {searchResults.users.map(user => renderUserCard(user))}
                      </div>
                    </Card>
                  )}

                  {/* Load More Search Results */}
                  {searchHasMore && (
                    <div className="text-center">
                      <Button
                        onClick={handleLoadMoreSearch}
                        disabled={loadingMoreSearch}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                      >
                        {loadingMoreSearch && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Load More Results
                      </Button>
                    </div>
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
              {!searchQuery && searchHistory.length > 0 && (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <h3 className="text-lg font-bold text-white">Recent Searches</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSearchHistory}
                      className="text-slate-400 hover:text-white"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((query, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearchHistoryClick(query)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        >
                          {query}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSearchHistoryItem(query)}
                          className="h-6 w-6 text-slate-500 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </Button>
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
                      {popularHasMore && (
                        <div className="text-center pt-4">
                          <Button
                            onClick={handleLoadMorePopular}
                            disabled={loadingMorePopular}
                            variant="outline"
                            className="border-slate-600 hover:bg-slate-800"
                          >
                            {loadingMorePopular && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Load More Communities
                          </Button>
                        </div>
                      )}
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