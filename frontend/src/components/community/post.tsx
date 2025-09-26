"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Repeat2, Share, MoveHorizontal as MoreHorizontal, TrendingUp } from 'lucide-react'
import { cn } from "@/lib/utils"

interface PostProps {
  id: string
  author: {
    name: string
    username: string
    avatar: string
    verified?: boolean
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  reposts: number
  image?: string
  trending?: boolean
}

export default function Post({
  id,
  author,
  content,
  timestamp,
  likes,
  comments,
  reposts,
  image,
  trending
}: PostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [localLikes, setLocalLikes] = useState(likes)
  const [localReposts, setLocalReposts] = useState(reposts)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLocalLikes(isLiked ? localLikes - 1 : localLikes + 1)
  }

  const handleRepost = () => {
    setIsReposted(!isReposted)
    setLocalReposts(isReposted ? localReposts - 1 : localReposts + 1)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 p-4 sm:p-6">
      <div className="flex gap-3 sm:gap-4">
        {/* Avatar */}
        <Avatar className="w-10 sm:w-12 h-10 sm:h-12 ring-2 ring-slate-700/50 flex-shrink-0">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <div className="flex items-center gap-1 min-w-0">
                <h3 className="font-semibold text-white hover:underline cursor-pointer truncate">
                  {author.name}
                </h3>
                {author.verified && (
                  <div className="w-4 sm:w-5 h-4 sm:h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {trending && (
                  <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-orange-400 flex-shrink-0" />
                )}
              </div>
              <span className="text-slate-400 text-sm truncate">@{author.username}</span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-500 hover:underline cursor-pointer text-sm">{timestamp}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-white whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{content}</p>
            {image && (
              <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/50">
                <img
                  src={image}
                  alt="Post image"
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-2 sm:px-3 py-2"
            >
              <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{formatNumber(comments)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-2",
                isReposted
                  ? "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  : "text-slate-400 hover:text-green-400 hover:bg-green-400/10"
              )}
            >
              <Repeat2 className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{formatNumber(localReposts)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-2",
                isLiked
                  ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
              )}
            >
              <Heart className={cn("w-4 sm:w-5 h-4 sm:h-5", isLiked && "fill-current")} />
              <span className="text-xs sm:text-sm">{formatNumber(localLikes)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-2 sm:px-3 py-2"
            >
              <Share className="w-4 sm:w-5 h-4 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}