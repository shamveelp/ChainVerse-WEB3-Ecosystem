"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from 'lucide-react'

const whoToFollow = [
  {
    name: 'Ethereum Foundation',
    username: 'ethereum',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true
  },
  {
    name: 'OpenSea',
    username: 'opensea',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    verified: true
  }
]

export default function RightSidebar() {
  const [followedUsers, setFollowedUsers] = useState<string[]>([])

  const handleFollow = (username: string) => {
    setFollowedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    )
  }

  return (
    <aside className="hidden xl:block fixed right-0 top-0 w-72 pt-20 border-l border-slate-700/50 bg-slate-950 h-screen z-30">
      <div className="h-full overflow-y-auto scrollbar-hidden">
        <div className="p-3 space-y-4">
          {/* Who to Follow */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">Who to Follow</h3>
              </div>
              <div className="space-y-2">
                {whoToFollow.map((u) => (
                  <div key={u.username} className="flex items-center gap-2 hover:bg-slate-800/30 rounded-md p-2 cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs px-2 py-1"
                      variant={followedUsers.includes(u.username) ? "secondary" : "outline"}
                      onClick={() => handleFollow(u.username)}
                    >
                      {followedUsers.includes(u.username) ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </aside>
  )
}