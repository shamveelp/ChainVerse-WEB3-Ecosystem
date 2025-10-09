"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, Share2, Image, Video, Pin, MoveHorizontal as MoreHorizontal, Sparkles, Send, ThumbsUp, TrendingUp } from 'lucide-react'

const mockPosts = [
  {
    id: 1,
    author: "Alice Johnson",
    username: "@alice_defi",
    time: "2 hours ago",
    content: "Just completed the DeFi fundamentals quest! 🚀 The yield farming section was particularly insightful. Can't wait to apply these concepts in real projects.",
    likes: 23,
    comments: 7,
    shares: 3,
    isPinned: false,
    tags: ["DeFi", "Quest", "Learning"]
  },
  {
    id: 2,
    author: "Bob Smith",
    username: "@cryptobob",
    time: "4 hours ago",
    content: "Community update: We've reached 1,200+ members! 🎉 Thank you all for making this space amazing. Looking forward to our upcoming AMA session tomorrow.",
    likes: 89,
    comments: 15,
    shares: 12,
    isPinned: true,
    tags: ["Community", "Milestone", "AMA"]
  },
  {
    id: 3,
    author: "Carol Davis",
    username: "@carol_nft",
    time: "6 hours ago",
    content: "New NFT collection dropping next week! 🎨 We're partnering with local artists to create unique Web3 experiences. Preview coming soon...",
    likes: 45,
    comments: 12,
    shares: 8,
    isPinned: false,
    tags: ["NFT", "Art", "Partnership"]
  },
]

export default function FeedPage() {
  const [newPost, setNewPost] = useState("")

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      // Handle post submission
      setNewPost("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Community Feed
          </h1>
          <p className="text-gray-400 mt-2">Stay connected with your community</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </Button>
        </div>
      </div>

      {/* Create Post */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-400" />
            Share with your community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening in your community today?"
            className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-red-950/30">
                <Image className="h-4 w-4 mr-1" />
                Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-red-950/30">
                <Video className="h-4 w-4 mr-1" />
                Video
              </Button>
            </div>
            <Button 
              onClick={handlePostSubmit}
              disabled={!newPost.trim()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6">
        {mockPosts.map((post) => (
          <Card key={post.id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-red-800 text-white">
                      {post.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{post.author}</h4>
                      <span className="text-sm text-gray-400">{post.username}</span>
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{post.time}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-red-950/30">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-300 leading-relaxed">{post.content}</p>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-red-600/30 text-red-400 hover:bg-red-950/30">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-red-800/20">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-300 hover:bg-red-950/30 gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-300 hover:bg-blue-950/30 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-300 hover:bg-green-950/30 gap-2">
                  <Share2 className="h-4 w-4" />
                  <span>{post.shares}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button 
          variant="outline" 
          className="border-red-600/50 text-red-400 hover:bg-red-950/30"
        >
          Load More Posts
        </Button>
      </div>
    </div>
  )
}