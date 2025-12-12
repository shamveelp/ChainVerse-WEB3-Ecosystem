"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Repeat2, UserPlus, TrendingUp, Bell, Settings, Loader2, Video, Hash, Users } from 'lucide-react'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { useChat } from '@/hooks/useChat'
import { communityApiService } from '@/services/communityApiService'
import { ConversationResponse } from '@/types/user/community.types'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="h-5 w-5 text-red-400" />
    case 'comment':
    case 'message':
      return <MessageCircle className="h-5 w-5 text-blue-400" />
    case 'repost':
      return <Repeat2 className="h-5 w-5 text-green-400" />
    case 'follow':
      return <UserPlus className="h-5 w-5 text-purple-400" />
    case 'mention':
      return <Bell className="h-5 w-5 text-cyan-400" />
    case 'community':
      return <TrendingUp className="h-5 w-5 text-orange-400" />
    case 'chaincast_started':
      return <Video className="h-5 w-5 text-red-500" />
    case 'community_channel':
      return <Hash className="h-5 w-5 text-green-500" />
    case 'community_group':
      return <Users className="h-5 w-5 text-blue-500" />
    default:
      return <Bell className="h-5 w-5 text-slate-400" />
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const { conversations, fetchConversations, loading: chatLoading, markMessagesAsRead } = useChat()
  const [systemNotifications, setSystemNotifications] = useState<any[]>([])
  const [sysLoading, setSysLoading] = useState(true)
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'reposts', label: 'Reposts' }
  ]

  useEffect(() => {
    fetchConversations()
    fetchSystemNotifications()
  }, [fetchConversations])

  const fetchSystemNotifications = async () => {
    try {
      setSysLoading(true)
      const data = await communityApiService.getNotifications(1, 50)
      if (data && data.notifications) {
        setSystemNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch system notifications", error)
    } finally {
      setSysLoading(false)
    }
  }

  // Map chat conversations to notifications
  const messageNotifications = conversations
    .filter(conv => conv.lastMessage && !conv.lastMessage.isDeleted && conv.lastMessage.sender._id !== currentUser?._id)
    .map(conv => {
      const sender = conv.lastMessage?.sender;
      const senderName = typeof sender === 'object' ? (sender.name || sender.username) : 'Unknown User';
      const senderPic = typeof sender === 'object' ? sender.profilePic : '';
      const senderIsVerified = typeof sender === 'object' ? sender.isVerified : false;
      const senderUsername = typeof sender === 'object' ? sender.username : '';

      return {
        id: conv._id,
        type: 'message',
        user: {
          name: senderName,
          username: senderUsername,
          avatar: senderPic,
          verified: senderIsVerified
        },
        action: 'sent you a message',
        content: conv.lastMessage?.content,
        timestamp: conv.lastActivity, // Keep raw date for sorting
        formattedTimestamp: communityApiService.formatTimestamp(conv.lastActivity),
        read: conv.unreadCount === 0,
        data: conv,
        link: `/user/community/messages/${senderUsername}`
      };
    });

  // Map system notifications to UI format
  const mappedSystemNotifications = systemNotifications.map(notification => ({
    id: notification._id,
    type: notification.type,
    user: {
      name: notification.title, // Use title as "Name" e.g. "New Channel Message"
      username: '',
      avatar: '', // TODO: Could use community avatar/logo if available in metadata
      verified: false
    },
    action: '',
    content: notification.message,
    timestamp: notification.createdAt,
    formattedTimestamp: communityApiService.formatTimestamp(notification.createdAt),
    read: notification.read,
    data: notification,
    link: notification.link || '#'
  }));

  const allNotifications = [...messageNotifications, ...mappedSystemNotifications].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'message') {
      if (!notification.read) {
        await markMessagesAsRead(notification.id);
      }
      if (notification.link) router.push(notification.link);
    } else {
      // System Notification
      if (!notification.read) {
        try {
          await communityApiService.markNotificationAsRead(notification.id);
          // Update local state to reflect read status
          setSystemNotifications(prev => prev.map(n => n._id === notification.id ? { ...n, read: true } : n));
        } catch (e) {
          console.error("Failed to mark as read", e);
        }
      }
      if (notification.link && notification.link !== '#') {
        router.push(notification.link);
      }
    }
  }

  const filteredNotifications = allNotifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'mentions') return n.type === 'mention'
    // 'likes', 'follows', 'reposts' might need real data later
    return false
  })

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
                    // onClick={handleMarkAllRead} // TODO: Implement mark all read for conversations
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
                    className={`flex-1 ${filter === filterItem.id
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
              {chatLoading && sysLoading && messageNotifications.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:border-slate-600/50 ${!notification.read
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
                          <span className="text-slate-500 text-sm">• {notification.formattedTimestamp}</span>
                        </div>

                        {notification.content && (
                          <p className="text-slate-300 text-sm bg-slate-800/30 rounded-lg p-2 mt-2 truncate">
                            {notification.content}
                          </p>
                        )}
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg text-slate-400">No notifications yet</p>
                  <p className="text-sm text-slate-500">
                    {filter === 'all'
                      ? "When you get messages or notifications, they'll show up here"
                      : "No notifications match this filter"}
                  </p>
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