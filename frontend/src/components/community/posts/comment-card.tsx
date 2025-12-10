"use client"

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, MoreHorizontal, CreditCard as Edit, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { Comment } from '@/services/postsApiService'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MentionTextarea from './mention-textarea'
import { formatTimeAgo, formatStats } from '@/utils/format'
import { USER_ROUTES } from '@/routes'

interface CommentCardProps {
  comment: Comment;
  onReply?: (commentId: string, content: string, mentionedUser?: string) => Promise<void>;
  onLikeToggle?: (commentId: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
  replies?: Comment[];
  onLoadReplies?: (commentId: string) => Promise<void>;
  className?: string;
}

export default function CommentCard({
  comment,
  onReply,
  onLikeToggle,
  onEdit,
  onDelete,
  depth = 0,
  maxDepth = 3,
  replies = [],
  onLoadReplies,
  className
}: CommentCardProps) {
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplies, setShowReplies] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [repliesLoaded, setRepliesLoaded] = useState(false)

  const isNested = depth > 0
  const canNestFurther = depth < maxDepth
  const hasReplies = comment.repliesCount > 0
  const showNestedReplies = showReplies && replies.length > 0

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return

    setIsLoading(true)
    try {
      await onReply(comment._id, replyContent.trim(), comment.author.username)
      setReplyContent('')
      setIsReplying(false)
      toast.success('Reply added successfully!')
    } catch (error: any) {
      toast.error('Failed to add reply', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim() || !onEdit) return

    setIsLoading(true)
    try {
      await onEdit(comment._id, editContent.trim())
      setIsEditing(false)
      toast.success('Comment updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update comment', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsLoading(true)
    try {
      await onDelete(comment._id)
      toast.success('Comment deleted successfully!')
    } catch (error: any) {
      toast.error('Failed to delete comment', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!onLikeToggle) return

    try {
      await onLikeToggle(comment._id)
    } catch (error: any) {
      toast.error('Failed to update like', {
        description: error.message || 'Please try again'
      })
    }
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`${USER_ROUTES.COMMUNITY}/${comment.author.username}`)
  }

  const loadReplies = async () => {
    if (!onLoadReplies || repliesLoaded) return

    setIsLoading(true)
    try {
      await onLoadReplies(comment._id)
      setRepliesLoaded(true)
    } catch (error: any) {
      toast.error('Failed to load replies')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleReplies = () => {
    if (!showReplies && hasReplies && !repliesLoaded) {
      loadReplies()
    }
    setShowReplies(!showReplies)
  }

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-3">
          <MentionTextarea
            value={editContent}
            onChange={setEditContent}
            placeholder="Edit your comment..."
            className="min-h-[80px]"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {editContent.length}/1000
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!editContent.trim() || isLoading || editContent.length > 1000}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
              >
                {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Parse mentions and make them clickable
    const parts = comment.content.split(/(\@\w+)/g)
    return (
      <p className="text-white leading-relaxed text-sm">
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.slice(1)
            return (
              <span
                key={index}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`${USER_ROUTES.COMMUNITY}/${username}`)
                }}
              >
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }

  return (
    <div className={cn("group", className)}>
      {/* Main Comment */}
      <Card className={cn(
        "bg-slate-800/30 backdrop-blur-sm border-slate-700/30 transition-all duration-200",
        isNested ? "ml-4 border-l-2 border-l-slate-600/50" : "",
        "hover:bg-slate-800/40 hover:border-slate-600/50"
      )}>
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <Avatar
              className={cn(
                "ring-2 ring-slate-700/50 flex-shrink-0 cursor-pointer transition-all",
                isNested ? "w-8 h-8" : "w-10 h-10",
                "hover:ring-cyan-400/50"
              )}
              onClick={handleAuthorClick}
            >
              <AvatarImage src={comment.author.profilePic} alt={comment.author.name} />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs">
                {comment.author.name.charAt(0)?.toUpperCase() || comment.author.username.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h4
                    className="font-semibold text-white hover:underline cursor-pointer text-sm"
                    onClick={handleAuthorClick}
                  >
                    {comment.author.name}
                  </h4>
                  {comment.author.isVerified && (
                    <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <span
                    className="text-slate-400 text-sm cursor-pointer hover:underline"
                    onClick={handleAuthorClick}
                  >
                    @{comment.author.username}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-500 text-sm hover:underline cursor-pointer">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                  {comment.editedAt && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-500 text-sm">edited</span>
                    </>
                  )}
                </div>

                {/* Actions Menu */}
                {comment.isOwnComment && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-slate-700 w-8 h-8 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className="text-slate-200 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-400 hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Content */}
              <div className="mb-3">
                {renderContent()}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-3 py-1 h-8"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Reply</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 h-8",
                    comment.isLiked
                      ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                  )}
                >
                  <Heart className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
                  <span className="text-sm">{formatStats(comment.likesCount)}</span>
                </Button>

                {/* Show/Hide Replies Button */}
                {hasReplies && canNestFurther && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleReplies}
                    className="flex items-center gap-1 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-3 py-1 h-8"
                  >
                    {showReplies ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-sm">{formatStats(comment.repliesCount)} replies</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-3 ml-4">
          <Card className="bg-slate-800/50 border-slate-700/50 p-4">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 ring-2 ring-slate-700/50 flex-shrink-0">
                <AvatarImage
                  src={currentUser?.profileImage || ''}
                  alt={currentUser?.name || currentUser?.username || 'User'}
                />
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs">
                  {(currentUser?.name || currentUser?.username)?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <MentionTextarea
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder={`Reply to @${comment.author.username}...`}
                  className="min-h-[80px] text-sm"
                  maxLength={1000}
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-slate-400">
                    {replyContent.length}/1000
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsReplying(false)
                        setReplyContent('')
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isLoading || replyContent.length > 1000}
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Nested Replies */}
      {showNestedReplies && canNestFurther && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              onReply={onReply}
              onLikeToggle={onLikeToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
              maxDepth={maxDepth}
              onLoadReplies={onLoadReplies}
            />
          ))}
        </div>
      )}

      {/* Load More Replies for Deep Nesting */}
      {!canNestFurther && hasReplies && !showReplies && (
        <div className="mt-3 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
          >
            Show {formatStats(comment.repliesCount)} more replies
          </Button>
        </div>
      )}
    </div>
  )
}