"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Hash, Clock, X, Loader2 } from 'lucide-react'
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
        setSearchResults((prev: SearchResponse | null) => prev ? {
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
        setSearchResults((prev: SearchResponse | null) => prev ? {
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
      className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border-b border-slate-800 last:border-0"
      onClick={() => handleCommunityClick(community)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-slate-800 flex-shrink-0">
          <AvatarImage src={community.logo} alt={community.communityName} />
          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            {communityExploreApiService.getCommunityAvatarFallback(community.communityName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-bold text-white group-hover:underline truncate">
                {community.communityName}
              </h4>
              {community.isVerified && (
                <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>

            {showJoinButton && currentUser && (
              <Button
                size="sm"
                variant={community.isMember ? "outline" : "secondary"}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCommunityAction(community, community.isMember ? 'leave' : 'join')
                }}
                className={`rounded-full font-bold h-8 px-4 ${community.isMember
                  ? 'border-slate-600 text-white hover:border-red-500 hover:text-red-500 hover:bg-transparent'
                  : 'bg-white text-black hover:bg-slate-200'
                  }`}
              >
                {community.isMember ? 'Joined' : 'Join'}
              </Button>
            )}
          </div>

          <p className="text-slate-400 text-sm mb-2 line-clamp-2">{community.description}</p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{communityExploreApiService.formatMemberCount(community.memberCount)} members</span>
            <div className="flex items-center">
              <Hash className="w-3 h-3 mr-0.5" />
              {community.category}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUserCard = (user: UserSearchResult) => (
    <div
      key={user._id}
      className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border-b border-slate-800 last:border-0"
      onClick={() => handleUserClick(user)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-slate-800 flex-shrink-0">
          <AvatarImage src={user.profilePic} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="font-bold text-white group-hover:underline truncate">
                  {user.name}
                </h4>
                {user.isVerified && (
                  <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm">@{user.username}</p>
            </div>

            {currentUser && currentUser.username !== user.username && (
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "secondary"}
                className={`rounded-full font-bold h-8 px-4 ${user.isFollowing
                  ? 'border-slate-600 text-white hover:border-red-500 hover:text-red-500 hover:bg-transparent'
                  : 'bg-white text-black hover:bg-slate-200'
                  }`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {user.bio && <p className="text-slate-400 text-sm mb-2 line-clamp-2">{user.bio}</p>}

          <div className="text-xs text-slate-500">
            <span>{communityExploreApiService.formatMemberCount(user.followersCount)} followers</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="space-y-0">
        {/* Header */}
        <div className="sticky top-[4.5rem] bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 pb-2 pt-[29px] z-10 -mx-[1px] -mt-[1px]">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search ChainVerse"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-slate-900 border-none rounded-full text-white placeholder:text-slate-400 h-10 focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 px-2 overflow-x-auto no-scrollbar">
            {filters.map((filter) => (
              <div
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`cursor-pointer border-b-4 py-2 font-medium transition-colors whitespace-nowrap ${activeFilter === filter.id
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                {filter.label}
              </div>
            ))}
          </div>
        </div>

        <div className="px-0 pb-6">
          {/* Search Results */}
          {searchQuery.trim() && searchResults && (
            <div className="space-y-4">
              {/* Communities Results */}
              {searchResults.communities.length > 0 && (
                <div className="border-b border-slate-800 pb-2">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Communities</h3>
                  </div>
                  <div className="space-y-0">
                    {searchResults.communities.map(community => renderCommunityCard(community))}
                  </div>
                </div>
              )}

              {/* Users Results */}
              {searchResults.users.length > 0 && (
                <div className="border-b border-slate-800 pb-2">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">People</h3>
                  </div>
                  <div className="space-y-0">
                    {searchResults.users.map(user => renderUserCard(user))}
                  </div>
                </div>
              )}

              {/* Load More Search Results */}
              {searchHasMore && (
                <div className="text-center py-4">
                  <Button
                    onClick={handleLoadMoreSearch}
                    disabled={loadingMoreSearch}
                    variant="ghost"
                    className="text-cyan-500 hover:text-cyan-400 hover:bg-slate-900"
                  >
                    Show more results
                  </Button>
                </div>
              )}

              {/* No Results */}
              {searchResults.communities.length === 0 && searchResults.users.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-lg font-bold text-white mb-2">No results for "{searchQuery}"</p>
                  <p className="text-slate-500">Try searching for something else.</p>
                </div>
              )}
            </div>
          )}

          {/* Popular Communities (Default View) */}
          {!searchQuery && (
            <div className="space-y-0">
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Trends for you</h3>
              </div>

              {loadingPopular ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <div className="space-y-0">
                  {popularCommunities.map(community => renderCommunityCard(community))}
                  {popularHasMore && (
                    <div className="text-center py-4 border-b border-slate-800">
                      <Button
                        onClick={handleLoadMorePopular}
                        disabled={loadingMorePopular}
                        variant="ghost"
                        className="text-cyan-500 hover:text-cyan-400 hover:bg-slate-900"
                      >
                        Show more
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}