"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share, MoreHorizontal, TrendingUp, CreditCard as Edit, Trash2, Loader2, Bookmark } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { Post } from '@/services/postsApiService'
import { postsApiService } from '@/services/postsApiService'
import { toast } from 'sonner'
import { formatTimeAgo, formatStats } from '@/utils/format'
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
import MentionTextarea from './mention-textarea'

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onCommentClick?: (post: Post) => void;
  onPostUpdate?: (updatedPost: Post) => void;
  onPostDelete?: (postId: string) => void;
  showBorder?: boolean;
  className?: string;
}

export default function PostCard({
  post,
  onLikeToggle,
  onCommentClick,
  onPostUpdate,
  onPostDelete,
  showBorder = true,
  className
}: PostCardProps) {
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [sharesCount, setSharesCount] = useState(post.sharesCount)
  const [isLiking, setIsLiking] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isLiking) return

    // Optimistic update
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1

    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)
    setIsLiking(true)

    try {
      const response = await postsApiService.togglePostLike(post._id)

      // Update with server response
      setIsLiked(response.isLiked)
      setLikesCount(response.likesCount)

      onLikeToggle?.(post._id, response.isLiked, response.likesCount)
    } catch (error: any) {
      // Revert optimistic update on error
      setIsLiked(isLiked)
      setLikesCount(likesCount)

      toast.error('Failed to update like', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCommentClick?.(post)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()

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

      setSharesCount(response.sharesCount)
    } catch (error: any) {
      toast.error('Failed to share post', {
        description: error.message || 'Please try again'
      })
    }
  }

  const handlePostClick = () => {
    router.push(`/user/community/post/${post._id}`)
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/user/community/${post.author.username}`)
  }

  const handleEditPost = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setShowEditDialog(false)
      return
    }

    setIsUpdating(true)
    try {
      const response = await postsApiService.updatePost(post._id, editContent.trim(), post.mediaUrls)
      onPostUpdate?.(response.data)
      setShowEditDialog(false)
      toast.success('Post updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update post', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePost = async () => {
    setIsDeleting(true)
    try {
      await postsApiService.deletePost(post._id)
      onPostDelete?.(post._id)
      setShowDeleteDialog(false)
      toast.success('Post deleted successfully!')
    } catch (error: any) {
      toast.error('Failed to delete post', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const renderMedia = () => {
    if (post.mediaUrls.length === 0) return null

    return (
      <div className="mt-4 rounded-2xl overflow-hidden border border-slate-700/30 shadow-lg group">
        {post.mediaType === 'image' ? (
          <div className="grid gap-1" style={{
            gridTemplateColumns: post.mediaUrls.length === 1 ? '1fr' : post.mediaUrls.length === 2 ? '1fr 1fr' : '1fr 1fr',
            gridTemplateRows: post.mediaUrls.length > 2 ? '1fr 1fr' : '1fr'
          }}>
            {post.mediaUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative overflow-hidden">
                {index === 3 && post.mediaUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                    <span className="text-white text-xl font-semibold">+{post.mediaUrls.length - 3}</span>
                  </div>
                )}
                <img
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
    // Parse hashtags, mentions, and links
    const parts = post.content.split(/(\#\w+|\@\w+|https?:\/\/[^\s]+)/g)

    return (
      <p className="text-white whitespace-pre-wrap leading-relaxed text-base">
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

  return (
    <>
      <Card
        className={cn(
          "bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-sm hover:from-slate-900/80 hover:to-slate-800/80 transition-all duration-300 p-6 cursor-pointer group shadow-xl hover:shadow-2xl",
          showBorder ? "border-slate-700/30 hover:border-slate-600/50" : "border-none",
          className
        )}
        onClick={handlePostClick}
      >
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar
            className="w-12 h-12 ring-2 ring-slate-700/50 hover:ring-cyan-400/50 flex-shrink-0 cursor-pointer transition-all duration-300"
            onClick={handleAuthorClick}
          >
            <AvatarImage src={post.author.profilePic} alt={post.author.name} />
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
              {post.author.name.charAt(0)?.toUpperCase() || post.author.username.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h3
                    className="font-semibold text-white hover:underline cursor-pointer truncate transition-colors"
                    onClick={handleAuthorClick}
                  >
                    {post.author.name}
                  </h3>
                  {post.author.isVerified && (
                    <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">   
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {post.hashtags.includes('trending') && (
                    <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">Hot</span>
                    </div>
                  )}
                </div>
                <span 
                  className="text-slate-400 text-sm truncate cursor-pointer hover:underline transition-colors"
                  onClick={handleAuthorClick}
                >
                  @{post.author.username}
                </span>
                <span className="text-slate-500 hidden sm:inline">·</span>
                <span className="text-slate-500 hover:underline cursor-pointer text-sm transition-colors">
                  {formatTimeAgo(post.createdAt)}
                </span>
                {post.editedAt && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-500 text-sm">edited</span>
                  </>
                )}
              </div>

              {post.isOwnPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0 transition-all duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 shadow-xl">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowEditDialog(true)
                      }}
                      className="text-slate-200 hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-400 hover:bg-slate-700"
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
              {renderContent()}
              {renderMedia()}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between max-w-lg pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-4 py-2 transition-all"
                onClick={handleComment}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{formatStats(commentsCount)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 transition-all",
                  isLiked
                    ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                )}
              >
                {isLiking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                )}
                <span className="font-medium">{formatStats(likesCount)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-4 py-2 transition-all"
                onClick={handleShare}
              >
                <Share className="w-5 h-5" />
                <span className="font-medium">{formatStats(sharesCount)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-full px-4 py-2 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Bookmark className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Post</DialogTitle>
            <DialogDescription className="text-slate-400">
              Make changes to your post. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <MentionTextarea
              value={editContent}
              onChange={setEditContent}
              placeholder="What's happening in Web3?"
              className="min-h-[140px] bg-slate-800/50 border-slate-700 text-white resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {editContent.length}/2000
              </div>
              <div className="w-full max-w-xs bg-slate-800/50 rounded-full h-1 overflow-hidden ml-4">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    editContent.length > 1800 ? "bg-red-500" :
                    editContent.length > 1500 ? "bg-orange-500" :
                    editContent.length > 1000 ? "bg-yellow-500" :
                    "bg-gradient-to-r from-cyan-500 to-blue-500"
                  )}
                  style={{ width: `${Math.min((editContent.length / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPost}
              disabled={isUpdating || !editContent.trim() || editContent.length > 2000 || editContent === post.content}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-blue-500"
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Post</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}