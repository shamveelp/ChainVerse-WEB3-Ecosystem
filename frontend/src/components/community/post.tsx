"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, TrendingUp } from 'lucide-react'
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

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 p-6">
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar className="w-12 h-12 ring-2 ring-slate-700/50">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold text-white hover:underline cursor-pointer">
                  {author.name}
                </h3>
                {author.verified && (
                  <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {trending && (
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <span className="text-slate-400">@{author.username}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-500 hover:underline cursor-pointer">{timestamp}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mt-3">
            <p className="text-white whitespace-pre-wrap leading-relaxed">{content}</p>
            {image && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-slate-700/50">
                <img 
                  src={image} 
                  alt="Post image" 
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full px-3 py-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              className={cn(
                "flex items-center space-x-2 rounded-full px-3 py-2",
                isReposted
                  ? "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  : "text-slate-400 hover:text-green-400 hover:bg-green-400/10"
              )}
            >
              <Repeat2 className="w-5 h-5" />
              <span className="text-sm">{localReposts}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center space-x-2 rounded-full px-3 py-2",
                isLiked
                  ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              <span className="text-sm">{localLikes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full px-3 py-2"
            >
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}