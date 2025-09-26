"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Repeat2, UserPlus, TrendingUp, Bell, Settings } from 'lucide-react'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

const notifications = [
  {
    id: '1',
    type: 'like',
    user: {
      name: 'Vitalik Buterin',
      username: 'vitalikbuterin',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true
    },
    action: 'liked your post',
    content: 'The future of DeFi is looking brighter than ever!',
    timestamp: '2m',
    read: false
  },
  {
    id: '2',
    type: 'follow',
    user: {
      name: 'Andre Cronje',
      username: 'andrecronje',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true
    },
    action: 'started following you',
    timestamp: '5m',
    read: false
  }
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="h-5 w-5 text-red-400" />
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-blue-400" />
    case 'repost':
      return <Repeat2 className="h-5 w-5 text-green-400" />
    case 'follow':
      return <UserPlus className="h-5 w-5 text-purple-400" />
    case 'mention':
      return <Bell className="h-5 w-5 text-cyan-400" />
    case 'community':
      return <TrendingUp className="h-5 w-5 text-orange-400" />
    default:
      return <Bell className="h-5 w-5 text-slate-400" />
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const [markAllRead, setMarkAllRead] = useState(false)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'reposts', label: 'Reposts' }
  ]

  const handleMarkAllRead = () => {
    setMarkAllRead(true)
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Notifications</h2>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleMarkAllRead}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    Mark all as read
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
                {filters.map((filterItem) => (
                  <Button
                    key={filterItem.id}
                    variant={filter === filterItem.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(filterItem.id)}
                    className={`flex-1 ${
                      filter === filterItem.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterItem.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="px-4 space-y-2 pb-6">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:border-slate-600/50 ${
                    (!notification.read && !markAllRead)
                      ? 'bg-slate-900/70 border-cyan-400/20 hover:bg-slate-900/90'
                      : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <Avatar className="w-10 h-10 ring-2 ring-slate-700/50">
                      <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm">
                        {notification.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <p className="font-semibold text-white truncate">{notification.user.name}</p>
                        {notification.user.verified && (
                          <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className="text-slate-400 text-sm">{notification.action}</span>
                        <span className="text-slate-500 text-sm">• {notification.timestamp}</span>
                      </div>

                      {notification.content && (
                        <p className="text-slate-300 text-sm bg-slate-800/30 rounded-lg p-2 mt-2">
                          {notification.content}
                        </p>
                      )}
                    </div>

                    {(!notification.read && !markAllRead) && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </Card>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg text-slate-400">No notifications yet</p>
                  <p className="text-sm text-slate-500">When you get notifications, they'll show up here</p>
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