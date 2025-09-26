"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image, Smile, Calendar, MapPin, Hash } from 'lucide-react'

export default function CreatePost() {
  const [content, setContent] = useState('')

  const handlePost = () => {
    if (content.trim()) {
      // Handle post submission
      console.log('Posting:', content)
      setContent('')
    }
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
      <div className="flex space-x-4">
        <Avatar className="w-12 h-12 ring-2 ring-slate-700/50">
          <AvatarImage src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100" alt="User" />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            AC
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            placeholder="What's happening in Web3?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-0 bg-transparent text-xl placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <Image className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <Hash className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <Smile className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <Calendar className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                <MapPin className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-slate-400">
                {content.length}/280
              </div>
              <Button
                onClick={handlePost}
                disabled={!content.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 rounded-full disabled:opacity-50"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}