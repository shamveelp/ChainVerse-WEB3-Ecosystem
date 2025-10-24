"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  TrendingUp, 
  Pin, 
  Trash2, 
  Loader2,
  RefreshCw,
  Users,
  Activity,
  MessageSquare
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { communityAdminFeedApiService } from '@/services/communityAdmin/communityAdminFeedApiService'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface CommunityPost {
  _id: string;
  author: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    isCommunityMember: boolean;
  };
  content: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isOwnPost: boolean;
  canModerate: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string;
}

export default function CommunityAdminFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string>()
  const [feedType, setFeedType] = useState<'all' | 'trending' | 'recent'>('all')
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeMembersToday: 0,
    postsToday: 0,
    engagementRate: 0
  })
  
  // Modal states
  const [deletePostId, setDeletePostId] = useState<string>()
  const [deleteReason, setDeleteReason] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const observerRef = useRef<IntersectionObserver>(null)
  const lastPostElementRef = useRef<HTMLDivElement>(null)

  // Set up intersection observer for infinite scroll
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts()
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loadingMore, hasMore])

  // Load initial posts
  useEffect(() => {
    loadPosts(true)
  }, [feedType])

  const loadPosts = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
        setCursor(undefined)
      }

      const response = await communityAdminFeedApiService.getCommunityFeed(
        isInitial ? undefined : cursor,
        10,
        feedType as any
      )

      if (response.success && response.data) {
        if (isInitial) {
          setPosts(response.data.posts)
        } else {
          setPosts(prev => [...prev, ...response.data!.posts])
        }
        
        setHasMore(response.data.hasMore)
        setCursor(response.data.nextCursor)
        setCommunityStats(response.data.communityStats)
      } else {
        toast.error(response.error || 'Failed to load community feed')
      }
    } catch (error: any) {
      console.error('Error loading posts:', error)
      toast.error('Failed to load community feed')
    } finally {
      if (isInitial) {
        setLoading(false)
      }
      setLoadingMore(false)
    }
  }

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await loadPosts(false)
  }

  const refreshFeed = async () => {
    await loadPosts(true)
  }

  const handleLike = async (postId: string) => {
    const postIndex = posts.findIndex(p => p._id === postId)
    if (postIndex === -1) return

    const post = posts[postIndex]
    const wasLiked = post.isLiked
    const newLikesCount = wasLiked ? post.likesCount - 1 : post.likesCount + 1

    // Optimistic update
    const updatedPosts = [...posts]
    updatedPosts[postIndex] = {
      ...post,
      isLiked: !wasLiked,
      likesCount: newLikesCount
    }
    setPosts(updatedPosts)

    try {
      const response = await communityAdminFeedApiService.togglePostLike(postId)
      
      if (response.success && response.data) {
        // Update with server response
        updatedPosts[postIndex] = {
          ...updatedPosts[postIndex],
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount
        }
        setPosts(updatedPosts)
      } else {
        // Revert optimistic update
        updatedPosts[postIndex] = post
        setPosts(updatedPosts)
        toast.error(response.error || 'Failed to update like')
      }
    } catch (error: any) {
      // Revert optimistic update
      const revertedPosts = [...posts]
      revertedPosts[postIndex] = post
      setPosts(revertedPosts)
      toast.error('Failed to update like')
    }
  }

  const handlePin = async (postId: string) => {
    try {
      const response = await communityAdminFeedApiService.pinPost(postId)
      
      if (response.success) {
        toast.success('Post pinned successfully')
        // You might want to add a visual indicator for pinned posts
      } else {
        toast.error(response.error || 'Failed to pin post')
      }
    } catch (error: any) {
      toast.error('Failed to pin post')
    }
  }

  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId)
    setDeleteReason('')
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletePostId) return

    try {
      const response = await communityAdminFeedApiService.deletePost(deletePostId, deleteReason)
      
      if (response.success) {
        setPosts(prev => prev.filter(post => post._id !== deletePostId))
        toast.success('Post deleted successfully')
        setShowDeleteDialog(false)
      } else {
        toast.error(response.error || 'Failed to delete post')
      }
    } catch (error: any) {
      toast.error('Failed to delete post')
    }
  }

  const renderMedia = (post: CommunityPost) => {
    if (post.mediaUrls.length === 0) return null

    return (
      <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden border border-red-700/30">
        {post.mediaType === 'image' ? (
          <div className="grid gap-2" style={{
            gridTemplateColumns: post.mediaUrls.length === 1 ? '1fr' : post.mediaUrls.length === 2 ? '1fr 1fr' : '1fr 1fr',
            gridTemplateRows: post.mediaUrls.length > 2 ? '1fr 1fr' : '1fr'
          }}>
            {post.mediaUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative overflow-hidden">
                {index === 3 && post.mediaUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <span className="text-white text-xl font-semibold">+{post.mediaUrls.length - 3}</span>
                  </div>
                )}
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                  style={{ aspectRatio: post.mediaUrls.length === 1 ? 'auto' : '1' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <video
            src={post.mediaUrls[0]}
            controls
            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
    )
  }

  const renderContent = (content: string) => {
    const parts = content.split(/(\#\w+|\@\w+)/g)

    return (
      <p className="text-white whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
        {parts.map((part, index) => {
          if (part.startsWith('#')) {
            return (
              <span key={index} className="text-red-400 hover:text-red-300 cursor-pointer">
                {part}
              </span>
            )
          } else if (part.startsWith('@')) {
            return (
              <span key={index} className="text-blue-400 hover:text-blue-300 cursor-pointer">
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto" />
            <p className="text-gray-400">Loading community feed...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Community Feed
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and moderate your community's posts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshFeed}
            variant="outline"
            size="sm"
            className="border-red-600/50 text-red-400 hover:bg-red-950/30"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Total Members</p>
                <p className="text-xl font-bold text-white">{communityStats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Active Today</p>
                <p className="text-xl font-bold text-white">{communityStats.activeMembersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Posts Today</p>
                <p className="text-xl font-bold text-white">{communityStats.postsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Engagement</p>
                <p className="text-xl font-bold text-white">{communityStats.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed Type Selector */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setFeedType('all')}
          variant={feedType === 'all' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            feedType === 'all' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          All Posts
        </Button>
        <Button
          onClick={() => setFeedType('recent')}
          variant={feedType === 'recent' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            feedType === 'recent' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          Recent
        </Button>
        <Button
          onClick={() => setFeedType('trending')}
          variant={feedType === 'trending' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            feedType === 'trending' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          Trending
        </Button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-gray-400">Your community members haven't posted anything yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <Card
              key={post._id}
              ref={index === posts.length - 1 ? lastPostRef : undefined}
              className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-200 p-4 sm:p-6"
            >
              <div className="flex gap-3 sm:gap-4">
                {/* Avatar */}
                <Avatar className="w-10 sm:w-12 h-10 sm:h-12 ring-2 ring-red-700/50 flex-shrink-0">
                  <AvatarImage src={post.author.profilePic} alt={post.author.name} />
                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-700 text-white">
                    {post.author.name.charAt(0)?.toUpperCase() || post.author.username.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <div className="flex items-center gap-1 min-w-0">
                        <h3 className="font-semibold text-white hover:underline cursor-pointer truncate">
                          {post.author.name}
                        </h3>
                        {post.author.isVerified && (
                          <div className="w-4 sm:w-5 h-4 sm:h-5 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <Badge variant="outline" className="border-red-600/50 text-red-400 text-xs">
                          Member
                        </Badge>
                      </div>
                      <span className="text-gray-400 text-sm truncate">@{post.author.username}</span>
                      <span className="text-gray-500 hidden sm:inline">·</span>
                      <span className="text-gray-500 hover:underline cursor-pointer text-sm">
                        {communityAdminFeedApiService.formatTimeAgo(post.createdAt)}
                      </span>
                      {post.editedAt && (
                        <>
                          <span className="text-gray-500">·</span>
                          <span className="text-gray-500 text-sm">edited</span>
                        </>
                      )}
                    </div>

                    {post.canModerate && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-red-800/30 flex-shrink-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-red-800/30">
                          <DropdownMenuItem
                            onClick={() => handlePin(post._id)}
                            className="text-gray-200 hover:bg-red-900/30"
                          >
                            <Pin className="w-4 h-4 mr-2" />
                            Pin Post
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(post._id)}
                            className="text-red-400 hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    {renderContent(post.content)}
                    {renderMedia(post)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between max-w-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full px-2 sm:px-3 py-2"
                    >
                      <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-xs sm:text-sm">{communityAdminFeedApiService.formatStats(post.commentsCount)}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post._id)}
                      className={cn(
                        "flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-2",
                        post.isLiked
                          ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          : "text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                      )}
                    >
                      <Heart className={cn("w-4 sm:w-5 h-4 sm:h-5", post.isLiked && "fill-current")} />
                      <span className="text-xs sm:text-sm">{communityAdminFeedApiService.formatStats(post.likesCount)}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-2 sm:px-3 py-2"
                    >
                      <Share className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-xs sm:text-sm">{communityAdminFeedApiService.formatStats(post.sharesCount)}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto" />
            <p className="text-gray-400 text-sm">Loading more posts...</p>
          </div>
        </div>
      )}

      {/* End of posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 text-sm">You've reached the end</p>
        </div>
      )}

      {/* Delete Post Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl border-red-800/30">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Post</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reason for deletion (optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="bg-red-950/20 border-red-800/30 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-red-600/50 hover:bg-red-950/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}