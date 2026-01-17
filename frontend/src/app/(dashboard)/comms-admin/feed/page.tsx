"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Users, Activity, MessageSquare, TrendingUp, MoreHorizontal, Pin, Trash2, MessageCircle, Heart, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import communityAdminFeedApiService from '@/services/communityAdmin/communityAdminFeedApiService'

// Reuse interfaces for consistency
interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
  isCommunityMember: boolean;
}

interface CommunityPost {
  _id: string;
  author: PostAuthor;
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') as 'allPosts' | 'members' | 'trending' | null

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string>()
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
  }, [currentTab])

  const loadPosts = async (isInitial = false) => {
    try {
      const type = currentTab || 'members' // Default to members if no tab

      if (isInitial) {
        setLoading(true)
        setCursor(undefined)
      }

      const response = await communityAdminFeedApiService.getCommunityFeed(
        isInitial ? undefined : cursor,
        10,
        type
      )

      if (response.success && response.data) {
        // Deduplicate new posts against themselves (backend sanity check)
        const uniqueNewPosts = response.data!.posts.filter((post, index, self) =>
          index === self.findIndex((p) => p._id === post._id)
        );

        if (isInitial) {
          setPosts(uniqueNewPosts)
        } else {
          setPosts(prev => {
            // Filter out existing posts to prevent duplicates
            const existingIds = new Set(prev.map(p => p._id));
            const distinctNewPosts = uniqueNewPosts.filter(p => !existingIds.has(p._id));
            return [...prev, ...distinctNewPosts];
          })
        }

        setHasMore(response.data.hasMore)
        setCursor(response.data.nextCursor)
        setCommunityStats(response.data.communityStats)
      } else {
        toast.error(response.error || 'Failed to load community feed')
      }
    } catch (err) {
      const error = err as Error
      console.error('Error loading posts:', error)
      toast.error('Failed to load community feed')
    } finally {
      if (isInitial) {
        setLoading(false)
      }
      setLoadingMore(false)
    }
  }

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      loadPosts(false)
    }
  }

  const refreshFeed = () => {
    loadPosts(true)
  }

  const handleTabChange = (tab: 'allPosts' | 'members' | 'trending') => {
    router.push(`/comms-admin/feed?tab=${tab}`)
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await communityAdminFeedApiService.togglePostLike(postId);
      if (response.success) {
        setPosts(prev => prev.map(p =>
          p._id === postId
            ? { ...p, isLiked: response.data!.isLiked, likesCount: response.data!.likesCount }
            : p
        ));
      } else {
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  }

  const handlePin = async (postId: string) => {
    try {
      const response = await communityAdminFeedApiService.pinPost(postId);
      if (response.success) {
        toast.success(response.message || "Post pinned/unpinned");
        // Ideally reload or update state
      } else {
        toast.error(response.error || "Failed to pin post");
      }
    } catch (error) {
      console.error("Pin error:", error);
    }
  }

  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId);
    setShowDeleteDialog(true);
  }

  const handleDeleteConfirm = async () => {
    if (!deletePostId) return;
    try {
      const response = await communityAdminFeedApiService.deletePost(deletePostId, deleteReason);
      if (response.success) {
        toast.success("Post deleted successfully");
        setPosts(prev => prev.filter(p => p._id !== deletePostId));
        setShowDeleteDialog(false);
        setDeleteReason("");
        setDeletePostId(undefined);
      } else {
        toast.error(response.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete post");
    }
  }

  const handlePostClick = (e: React.MouseEvent, postId: string) => {
    // Prevent navigation if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    router.push(`/comms-admin/feed/post/${postId}`);
  }

  const renderContent = (content: string) => {
    return <p className="text-gray-200 whitespace-pre-wrap">{content}</p>
  }

  const renderMedia = (post: CommunityPost) => {
    if (post.mediaType === 'none' || !post.mediaUrls.length) return null;
    return (
      <div className="mt-3 grid gap-2">
        {post.mediaUrls.map((url, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden bg-gray-900 border border-red-900/20">
            {post.mediaType === 'image' ? (
              <img src={url} alt="Post media" className="w-full h-auto object-contain max-h-[500px]" />
            ) : (
              <video src={url} controls className="w-full h-auto max-h-[500px]" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
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
                <p className="text-xl font-bold text-white">{communityAdminFeedApiService.formatStats(communityStats.totalMembers)}</p>
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
                <p className="text-xl font-bold text-white">{communityAdminFeedApiService.formatStats(communityStats.activeMembersToday)}</p>
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
                <p className="text-xl font-bold text-white">{communityAdminFeedApiService.formatStats(communityStats.postsToday)}</p>
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
          onClick={() => handleTabChange('allPosts')}
          variant={(currentTab === 'allPosts') ? 'default' : 'outline'}
          size="sm"
          className={cn(
            (currentTab === 'allPosts')
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          All Posts
        </Button>
        <Button
          onClick={() => handleTabChange('members')}
          variant={(currentTab === 'members' || !currentTab) ? 'default' : 'outline'}
          size="sm"
          className={cn(
            (currentTab === 'members' || !currentTab)
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          Members
        </Button>
        <Button
          onClick={() => handleTabChange('trending')}
          variant={(currentTab === 'trending') ? 'default' : 'outline'}
          size="sm"
          className={cn(
            (currentTab === 'trending')
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'border-red-600/50 text-red-400 hover:bg-red-950/30'
          )}
        >
          Trending
        </Button>
      </div>

      {/* Posts List */}
      {posts.length === 0 && !loading ? (
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
              className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-200 p-4 sm:p-6 cursor-pointer"
              onClick={(e) => handlePostClick(e, post._id)}
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