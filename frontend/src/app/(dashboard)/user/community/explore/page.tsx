"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Users, Star, Building2, User, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { communityExploreApiService, UserSearchResult, CommunitySearchResult, ExploreSearchResponse } from '@/services/userCommunityServices/communityExploreApiService'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

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

const popularCommunities = [
  {
    _id: '1',
    communityName: 'DeFi Builders United',
    username: 'defi-builders',
    description: 'Building the future of decentralized finance',
    category: 'Development',
    logo: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100',
    isVerified: true,
    membersCount: 45200,
    postsCount: 1234,
    status: 'approved',
    type: 'community' as const
  },
  {
    _id: '2',
    communityName: 'NFT Art Collective',
    username: 'nft-art-collective',
    description: 'Where digital art meets blockchain technology',
    category: 'Art & Design',
    logo: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=100',
    isVerified: false,
    membersCount: 32800,
    postsCount: 892,
    status: 'approved',
    type: 'community' as const
  },
  {
    _id: '3',
    communityName: 'Crypto Trading Masters',
    username: 'crypto-trading',
    description: 'Advanced trading strategies and market analysis',
    category: 'Trading',
    logo: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=100',
    isVerified: true,
    membersCount: 67100,
    postsCount: 2156,
    status: 'approved',
    type: 'community' as const
  }
]

export default function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchResults, setSearchResults] = useState<ExploreSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const filters = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'communities', label: 'Communities', icon: Building2 },
    { id: 'people', label: 'People', icon: User },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ]

  // Search function
  const performSearch = useCallback(async (query: string, filter: string) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await communityExploreApiService.searchExplore(
        query,
        filter as 'all' | 'users' | 'communities' | 'trending'
      )
      setSearchResults(results)
    } catch (err: any) {
      console.error('Search failed:', err)
      setError(err.message || 'Search failed')
      toast.error('Search failed', {
        description: err.message || 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery) {
      performSearch(debouncedSearchQuery, activeFilter)
    } else {
      setSearchResults(null)
    }
  }, [debouncedSearchQuery, activeFilter, performSearch])

  // Handle search history click
  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query)
  }

  // Handle profile navigation
  const handleProfileClick = (item: UserSearchResult | CommunitySearchResult) => {
    if (item.type === 'user') {
      router.push(`/user/community/${item.username}`)
    } else {
      router.push(`/user/community/profile/${item.username}`)
    }
  }

  // Memoized search results
  const displayResults = useMemo(() => {
    if (!searchResults) return { users: [], communities: [] }
    
    const { users = [], communities = [] } = searchResults
    
    if (activeFilter === 'people') {
      return { users, communities: [] }
    } else if (activeFilter === 'communities') {
      return { users: [], communities }
    }
    
    return { users, communities }
  }, [searchResults, activeFilter])

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
                  placeholder="Search Web3 communities, topics, and people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400 h-12"
                />
                {loading && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
                {filters.map((filter) => {
                  const IconComponent = filter.icon
                  return (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex-1 flex items-center gap-2 ${
                        activeFilter === filter.id
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {filter.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="px-4 space-y-6 pb-6">
              {/* Error Display */}
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Search Results */}
              {searchQuery && searchResults && (
                <div className="space-y-6">
                  {/* People Results */}
                  {displayResults.users.length > 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">People</h3>
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                          {displayResults.users.length}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {displayResults.users.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => handleProfileClick(user)}
                            className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12 ring-2 ring-slate-700/50">
                                <AvatarImage src={user.profilePic} alt={user.name} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                  {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white group-hover:text-cyan-300">
                                    {user.name || user.username}
                                  </h4>
                                  {user.isVerified && (
                                    <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">       
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm mb-2">@{user.username}</p>
                                {user.bio && (
                                  <p className="text-slate-300 text-sm mb-2">{user.bio}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span>{communityExploreApiService.formatStats(user.followersCount)} followers</span>
                                  <span>{communityExploreApiService.formatStats(user.followingCount)} following</span>
                                </div>
                              </div>

                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-slate-600 hover:bg-cyan-500/20 hover:border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle follow action
                                }}
                              >
                                {user.isFollowing ? 'Following' : 'Follow'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Communities Results */}
                  {displayResults.communities.length > 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Communities</h3>
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                          {displayResults.communities.length}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {displayResults.communities.map((community) => (
                          <div
                            key={community._id}
                            onClick={() => handleProfileClick(community)}
                            className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12 ring-2 ring-slate-700/50">
                                <AvatarImage src={community.logo} alt={community.communityName} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                  {community.communityName?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white group-hover:text-cyan-300">
                                    {community.communityName}
                                  </h4>
                                  {community.isVerified && (
                                    <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">       
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm mb-2">@{community.username}</p>
                                <p className="text-slate-300 text-sm mb-2">{community.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span>{communityExploreApiService.formatStats(community.membersCount)} members</span>
                                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                                      {community.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-slate-600 hover:bg-purple-500/20 hover:border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle join action
                                }}
                              >
                                {community.isJoined ? 'Joined' : 'Join'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* No Results */}
                  {searchResults && displayResults.users.length === 0 && displayResults.communities.length === 0 && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                        <p className="text-lg text-slate-400 mb-2">No results found</p>
                        <p className="text-sm text-slate-500">Try searching with different keywords</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Default Content (when not searching) */}
              {!searchQuery && (
                <>
                  {/* Search History */}
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

                  {/* Trending Topics */}
                  <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                      <h3 className="text-lg font-bold text-white">Trending Now</h3>
                    </div>
                    <div className="space-y-3">
                      {trendingTopics.map((topic) => (
                        <div 
                          key={topic.tag} 
                          className="group cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 transition-colors"
                          onClick={() => handleSearchHistoryClick(topic.tag)}
                        >
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

                  {/* Popular Communities */}
                  <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">Popular Communities</h3>
                    </div>
                    <div className="space-y-4">
                      {popularCommunities.map((community) => (
                        <div 
                          key={community._id} 
                          className="group cursor-pointer hover:bg-slate-800/30 rounded-xl p-4 transition-colors border border-transparent hover:border-slate-700/50"
                          onClick={() => handleProfileClick(community)}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="w-14 h-14 ring-2 ring-slate-700/50">
                              <AvatarImage src={community.logo} alt={community.communityName} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                {community.communityName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-white group-hover:text-cyan-300">
                                    {community.communityName}
                                  </h4>
                                  {community.isVerified && (
                                    <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">       
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                                  +12%
                                </Badge>
                              </div>

                              <p className="text-slate-400 text-sm mb-2">{community.description}</p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span>{communityExploreApiService.formatStats(community.membersCount)} members</span>
                                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                                    {community.category}
                                  </Badge>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-slate-600 hover:bg-purple-500/20 hover:border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle join action
                                  }}
                                >
                                  Join
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
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