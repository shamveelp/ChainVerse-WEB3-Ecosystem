"use client"

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Heart, MessageCircle, Share, Send, Loader2, MoreHorizontal, TrendingUp } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { postsApiService, Post, Comment } from '@/services/postsApiService'
import { useComments } from '@/hooks/useComments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatTimeAgo, formatStats, formatFullDate } from '@/utils/format'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import CommentCard from '@/components/community/posts/comment-card'
import MentionTextarea from '@/components/community/posts/mention-textarea'
import Image from 'next/image'

interface PostPageProps {
  params: Promise<{
    postId: string
  }>
}

export default function PostPage({ params }: PostPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { postId } = resolvedParams

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentsWithReplies, setCommentsWithReplies] = useState<Record<string, Comment[]>>({})

  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const profile = useSelector((state: RootState) => state.communityProfile?.profile)

  const {
    comments,
    loading: commentsLoading,
    hasMore: hasMoreComments,
    createComment,
    loadComments,
    loadMoreComments,
    loadReplies,
    toggleCommentLike,
    updateCommentInList,
    clearComments
  } = useComments()

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || commentsLoading || !hasMoreComments) return

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreComments) {
        loadMoreComments(postId)
      }
    })

    observerRef.current.observe(node)

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [commentsLoading, hasMoreComments, loadMoreComments, postId])

  // Load post and comments
  useEffect(() => {
    const loadPostData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await postsApiService.getPostById(postId)
        setPost(response.data.post)

        // Load comments
        await loadComments(postId, true)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        toast.error('Failed to load post', {
          description: errorMessage || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      loadPostData()
    }
  }, [postId, loadComments])

  const handleBack = () => {
    router.back()
  }

  const handleLike = async () => {
    if (!post) return

    try {
      // Optimistic update
      const newIsLiked = !post.isLiked
      const newLikesCount = newIsLiked ? post.likesCount + 1 : post.likesCount - 1

      setPost(prev => prev ? {
        ...prev,
        isLiked: newIsLiked,
        likesCount: newLikesCount
      } : null)

      const response = await postsApiService.togglePostLike(post._id)

      // Update with server response
      setPost(prev => prev ? {
        ...prev,
        isLiked: response.isLiked,
        likesCount: response.likesCount
      } : null)
    } catch (error: unknown) {
      // Revert optimistic update on error
      setPost(prev => prev ? {
        ...prev,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1
      } : null)

      const errorMessage = error instanceof Error ? error.message : 'Failed to update like'
      toast.error('Failed to update like', {
        description: errorMessage || 'Please try again'
      })
    }
  }

  const handleShare = async () => {
    if (!post) return

    try {
      const response = await postsApiService.sharePost(post._id)

      if (navigator.share) {
        await navigator.share({
          title: `Post by @${post.author.username}`,
          text: post.content,
          url: response.shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(response.shareUrl)
        toast.success('Link copied to clipboard!')
      }

      setPost(prev => prev ? {
        ...prev,
        sharesCount: response.sharesCount
      } : null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share post'
      toast.error('Failed to share post', {
        description: errorMessage || 'Please try again'
      })
    }
  }

  const handleComment = async () => {
    if (!commentContent.trim() || !post) return

    setIsCommenting(true)
    try {
      const commentData = {
        postId: post._id,
        content: commentContent.trim(),
        parentCommentId: undefined
      }

      const newComment = await createComment(commentData)
      if (newComment) {
        setCommentContent('')

        // Update post comments count
        setPost(prev => prev ? {
          ...prev,
          commentsCount: prev.commentsCount + 1
        } : null)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
      toast.error('Failed to add comment', {
        description: errorMessage || 'Please try again'
      })
    } finally {
      setIsCommenting(false)
    }
  }

  const handleReply = async (parentCommentId: string, content: string, mentionedUser?: string) => {
    if (!post) return

    try {
      const replyData = {
        postId: post._id,
        content: mentionedUser && !content.includes(`@${mentionedUser}`)
          ? `@${mentionedUser} ${content}`
          : content,
        parentCommentId
      }

      const newReply = await createComment(replyData)
      if (newReply) {
        // Add reply to the replies of the parent comment
        setCommentsWithReplies(prev => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), newReply]
        }))

        // Update post comments count
        setPost(prev => prev ? {
          ...prev,
          commentsCount: prev.commentsCount + 1
        } : null)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
      toast.error('Failed to add reply', {
        description: errorMessage || 'Please try again'
      })
    }
  }

  const handleLoadReplies = async (commentId: string) => {
    try {
      const replies = await loadReplies(commentId)
      setCommentsWithReplies(prev => ({
        ...prev,
        [commentId]: replies
      }))
    } catch (error: unknown) {
      toast.error('Failed to load replies')
    }
  }

  const handleAuthorClick = () => {
    if (post) {
      router.push(`/user/community/${post.author.username}`)
    }
  }

  const renderMedia = () => {
    if (!post || post.mediaUrls.length === 0) return null

    return (
      <div className="mt-6 rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg">
        {post.mediaType === 'image' ? (
          <div className="grid gap-2" style={{
            gridTemplateColumns: post.mediaUrls.length === 1 ? '1fr' : post.mediaUrls.length === 2 ? '1fr 1fr' : '1fr 1fr',
            gridTemplateRows: post.mediaUrls.length > 2 ? '1fr 1fr' : '1fr'
          }}>
            {post.mediaUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative overflow-hidden">
                {index === 3 && post.mediaUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                    <span className="text-white text-2xl font-semibold">+{post.mediaUrls.length - 3}</span>
                  </div>
                )}
                <Image
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  style={{ aspectRatio: post.mediaUrls.length === 1 ? 'auto' : '1' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <video
            src={post.mediaUrls[0]}
            controls
            className="w-full h-auto object-cover"
          />
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (!post) return null

    // Parse hashtags, mentions, and links
    const parts = post.content.split(/(\#\w+|\@\w+|https?:\/\/[^\s]+)/g)

    return (
      <p className="text-white whitespace-pre-wrap leading-relaxed text-lg">
        {parts.map((part, index) => {
          if (part.startsWith('#')) {
            return (
              <span
                key={index}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/user/community/explore?hashtag=${part.slice(1)}`)
                }}
              >
                {part}
              </span>
            )
          } else if (part.startsWith('@')) {
            return (
              <span
                key={index}
                className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/user/community/${part.slice(1)}`)
                }}
              >
                {part}
              </span>
            )
          } else if (part.startsWith('http')) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400 text-lg">Loading post...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <p className="text-slate-400 text-lg">{error || 'Post not found'}</p>
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Go Back
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
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-xl border-b border-slate-700/50 p-6 z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-10 h-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-white">Post</h2>
                  <p className="text-slate-400 text-sm">by @{post.author.username}</p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-6">
              <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50 p-8 shadow-xl">
                <div className="flex gap-4">
                  <Avatar
                    className="w-14 h-14 ring-2 ring-slate-700/50 flex-shrink-0 cursor-pointer hover:ring-cyan-400/50 transition-all"
                    onClick={handleAuthorClick}
                  >
                    <AvatarImage src={post.author.profilePic} alt={post.author.name} />
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                      {post.author.name.charAt(0)?.toUpperCase() || post.author.username.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-4">
                      <h3
                        className="font-semibold text-white hover:underline cursor-pointer text-lg"
                        onClick={handleAuthorClick}
                      >
                        {post.author.name}
                      </h3>
                      {post.author.isVerified && (
                        <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span
                        className="text-slate-400 cursor-pointer hover:underline"
                        onClick={handleAuthorClick}
                      >
                        @{post.author.username}
                      </span>
                      {post.hashtags.includes('trending') && (
                        <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-medium">Trending</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      {renderContent()}
                      {renderMedia()}
                    </div>

                    <div className="text-slate-500 text-sm mb-6 flex items-center gap-2">
                      <span>{formatFullDate(post.createdAt)}</span>
                      {post.editedAt && (
                        <>
                          <span>·</span>
                          <span>Edited</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-b border-slate-700/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-4 py-3 transition-all"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">{formatStats(post.commentsCount)}</span>
                        <span className="hidden sm:inline">Comments</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                          "flex items-center gap-2 rounded-full px-4 py-3 transition-all",
                          post.isLiked
                            ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                        <span className="font-medium">{formatStats(post.likesCount)}</span>
                        <span className="hidden sm:inline">Likes</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-4 py-3 transition-all"
                      >
                        <Share className="w-5 h-5" />
                        <span className="font-medium">{formatStats(post.sharesCount)}</span>
                        <span className="hidden sm:inline">Shares</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Comment Form */}
            {currentUser && (
              <div className="px-6 pb-6">
                <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50 p-6 shadow-lg">
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-slate-700/50 flex-shrink-0">
                      <AvatarImage
                        src={profile?.profilePic || currentUser?.profileImage || ''}
                        alt={profile?.name || currentUser?.name || currentUser?.username || 'User'}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                        {(profile?.name || currentUser?.name || currentUser?.username)?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <MentionTextarea
                        value={commentContent}
                        onChange={setCommentContent}
                        placeholder="Write a comment..."
                        className="min-h-[100px] text-base"
                        maxLength={1000}
                      />

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-slate-400">
                          {commentContent.length}/1000
                        </div>
                        <Button
                          onClick={handleComment}
                          disabled={!commentContent.trim() || isCommenting || commentContent.length > 1000}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full px-6"
                        >
                          {isCommenting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Send className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Comments Section */}
            <div className="px-6 pb-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Comments</h3>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <CommentCard
                      key={comment._id}
                      comment={comment}
                      onReply={handleReply}
                      onLikeToggle={toggleCommentLike}
                      replies={commentsWithReplies[comment._id] || []}
                      onLoadReplies={handleLoadReplies}
                    />
                  ))}

                  {/* Load more comments sentinel */}
                  {hasMoreComments && (
                    <div
                      ref={loadMoreRef}
                      className="flex justify-center pt-6"
                    >
                      {commentsLoading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading more...</span>
                        </div>
                      ) : (
                        <div className="h-4 w-full" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <h4 className="text-xl font-semibold text-white mb-2">No comments yet</h4>
                  <p className="text-slate-400 mb-4">Be the first to share your thoughts!</p>
                </div>
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