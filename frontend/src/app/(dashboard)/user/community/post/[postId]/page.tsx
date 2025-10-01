"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Heart, MessageCircle, Share, Send, Loader2, MoreHorizontal } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { postsApiService, Post, Comment } from '@/services/postsApiService'
import { useComments } from '@/hooks/useComments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

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
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const profile = useSelector((state: RootState) => state.communityProfile?.profile)

  const {
    comments,
    loading: commentsLoading,
    hasMore: hasMoreComments,
    createComment,
    loadComments,
    loadMoreComments,
    toggleCommentLike,
    updateCommentInList,
    clearComments
  } = useComments()

  // Load post and comments
  useEffect(() => {
    const loadPostData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await postsApiService.getPostById(postId)
        setPost(response.data.post)
        
        // Load initial comments from the post detail response
        if (response.data.comments.length > 0) {
          clearComments()
          // Set comments directly since they're already loaded
          // We'll need to modify useComments to accept initial comments
        }
        
        // Load additional comments if needed
        await loadComments(postId, true)
      } catch (err: any) {
        setError(err.message || 'Failed to load post')
        toast.error('Failed to load post', {
          description: err.message || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      loadPostData()
    }
  }, [postId, loadComments, clearComments])

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
    } catch (error: any) {
      // Revert optimistic update on error
      setPost(prev => prev ? {
        ...prev,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1
      } : null)
      
      toast.error('Failed to update like', {
        description: error.message || 'Please try again'
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
    } catch (error: any) {
      toast.error('Failed to share post', {
        description: error.message || 'Please try again'
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
        parentCommentId: replyingTo || undefined
      }

      const newComment = await createComment(commentData)
      if (newComment) {
        setCommentContent('')
        setReplyingTo(null)
        
        // Update post comments count
        setPost(prev => prev ? {
          ...prev,
          commentsCount: prev.commentsCount + 1
        } : null)
      }
    } catch (error: any) {
      toast.error('Failed to add comment', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsCommenting(false)
    }
  }

  const handleAuthorClick = () => {
    if (post) {
      router.push(`/user/community/${post.author.username}`)
    }
  }

  const formatTimeAgo = (date: Date | string) => {
    return postsApiService.formatTimeAgo(date)
  }

  const formatStats = (count: number) => {
    return postsApiService.formatStats(count)
  }

  const renderMedia = () => {
    if (!post || post.mediaUrls.length === 0) return null

    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50">
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
                  className="w-full h-auto object-cover"
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

    // Basic hashtag and mention highlighting
    const parts = post.content.split(/(\#\w+|\@\w+)/g)
    
    return (
      <p className="text-white whitespace-pre-wrap leading-relaxed text-lg">
        {parts.map((part, index) => {
          if (part.startsWith('#')) {
            return (
              <span key={index} className="text-cyan-400 hover:text-cyan-300 cursor-pointer">
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

  const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card className="bg-slate-800/50 border-slate-700/50 p-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 ring-2 ring-slate-700/50 flex-shrink-0">
          <AvatarImage src={comment.author.profilePic} alt={comment.author.name} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {comment.author.name.charAt(0)?.toUpperCase() || comment.author.username.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-white hover:underline cursor-pointer">
              {comment.author.name}
            </h4>
            {comment.author.isVerified && (
              <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-slate-400 text-sm">@{comment.author.username}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500 text-sm">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          <p className="text-white mb-3 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCommentLike(comment._id)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1",
                comment.isLiked
                  ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
              )}
            >
              <Heart className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
              <span className="text-sm">{formatStats(comment.likesCount)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment._id)}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-2 py-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Reply</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading post...</p>
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
                <p className="text-slate-400">{error || 'Post not found'}</p>
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
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-white">Post</h2>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-6">
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                <div className="flex gap-4">
                  <Avatar 
                    className="w-12 h-12 ring-2 ring-slate-700/50 flex-shrink-0 cursor-pointer"
                    onClick={handleAuthorClick}
                  >
                    <AvatarImage src={post.author.profilePic} alt={post.author.name} />
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                      {post.author.name.charAt(0)?.toUpperCase() || post.author.username.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 
                        className="font-semibold text-white hover:underline cursor-pointer"
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
                      <span className="text-slate-400">@{post.author.username}</span>
                    </div>

                    <div className="mb-4">
                      {renderContent()}
                      {renderMedia()}
                    </div>

                    <div className="text-slate-500 text-sm mb-4">
                      {new Date(post.createdAt).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {post.editedAt && ' · Edited'}
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-slate-700/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-4 py-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{formatStats(post.commentsCount)}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                          "flex items-center gap-2 rounded-full px-4 py-2",
                          post.isLiked
                            ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                        <span>{formatStats(post.likesCount)}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-4 py-2"
                      >
                        <Share className="w-5 h-5" />
                        <span>{formatStats(post.sharesCount)}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Comment Form */}
            {currentUser && (
              <div className="px-6 pb-6">
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-slate-700/50 flex-shrink-0">
                      <AvatarImage 
                        src={profile?.profilePic || currentUser?.profileImage || ''} 
                        alt={profile?.name || currentUser?.name || currentUser?.username || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                        {(profile?.name || currentUser?.name || currentUser?.username)?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <Textarea
                        placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="min-h-[80px] resize-none border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                        maxLength={1000}
                      />

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-slate-400">
                          {commentContent.length}/1000
                        </div>
                        <div className="flex items-center gap-2">
                          {replyingTo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null)
                                setCommentContent('')
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            onClick={handleComment}
                            disabled={!commentContent.trim() || isCommenting || commentContent.length > 1000}
                            size="sm"
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full"
                          >
                            {isCommenting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Send className="w-4 h-4 mr-2" />
                            {replyingTo ? 'Reply' : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Comments */}
            <div className="px-6 pb-6 space-y-4">
              {comments.length > 0 ? (
                <>
                  {comments.map((comment) => (
                    <CommentCard key={comment._id} comment={comment} />
                  ))}

                  {/* Load more comments */}
                  {hasMoreComments && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => loadMoreComments(post._id)}
                        disabled={commentsLoading}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                      >
                        {commentsLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Load More Comments
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">No comments yet</p>
                  <p className="text-slate-500 text-sm">Be the first to comment on this post</p>
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