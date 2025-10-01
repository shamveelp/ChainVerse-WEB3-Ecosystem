"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, MessageCircle, Loader as Loader2, Users, Clock, CheckCheck, Check } from 'lucide-react'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { useChat } from '@/hooks/useChat'
import { communityApiService, ConversationResponse } from '@/services/communityApiService'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'

export default function MessagesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null)

  const {
    conversations,
    loading,
    error,
    hasMoreConversations,
    fetchConversations,
    loadMoreConversations,
    markMessagesAsRead,
    clearError
  } = useChat()

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch conversations on mount and search change
  useEffect(() => {
    fetchConversations(undefined, searchDebounced)
  }, [searchDebounced, fetchConversations])

  // Load more when in view
  useEffect(() => {
    if (inView && hasMoreConversations && !loading) {
      loadMoreConversations(searchDebounced)
    }
  }, [inView, hasMoreConversations, loading, loadMoreConversations, searchDebounced])

  // Handle conversation click
  const handleConversationClick = useCallback(async (conversation: ConversationResponse) => {
    setSelectedConversation(conversation)
    
    // Mark messages as read if there are unread messages
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation._id)
    }

    // Navigate to chat page
    const otherParticipant = conversation.participants[0]
    if (otherParticipant?.username) {
      router.push(`/user/community/messages/${otherParticipant.username}`)
    }
  }, [router, markMessagesAsRead])

  // Handle new conversation
  const handleNewConversation = () => {
    // TODO: Implement new conversation modal
    toast.info('New conversation feature coming soon')
  }

  // Format last message preview
  const formatMessagePreview = (conversation: ConversationResponse): string => {
    const lastMessage = conversation.lastMessage
    if (!lastMessage) return 'No messages yet'

    if (lastMessage.isDeleted) {
      return 'Message was deleted'
    }

    const prefix = lastMessage.isOwnMessage ? 'You: ' : ''
    const content = lastMessage.content
    
    if (content.length > 50) {
      return `${prefix}${content.substring(0, 50)}...`
    }
    
    return `${prefix}${content}`
  }

  // Get message status icon
  const getMessageStatusIcon = (conversation: ConversationResponse) => {
    const lastMessage = conversation.lastMessage
    if (!lastMessage || !lastMessage.isOwnMessage) return null

    const isRead = lastMessage.readBy.length > 1 // More than just sender
    
    if (isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    } else {
      return <Check className="h-3 w-3 text-slate-400" />
    }
  }

  // Clear error handler
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Messages Layout */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="flex h-screen">
          {/* Conversations List */}
          <div className="w-full max-w-md border-r border-slate-700/50 bg-slate-900/30 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Messages</h2>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-slate-400 hover:text-white"
                  onClick={handleNewConversation}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="space-y-0">
                {loading && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
                      <p className="text-slate-400">Loading conversations...</p>
                    </div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <MessageCircle className="h-16 w-16 mx-auto text-slate-600" />
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">No messages yet</h3>
                        <p className="text-slate-400 mb-4">
                          {searchQuery ? 'No conversations match your search' : 'Start a conversation with someone!'}
                        </p>
                        {!searchQuery && (
                          <Button 
                            onClick={handleNewConversation}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {conversations.map((conversation) => {
                      const participant = conversation.participants[0]
                      if (!participant) return null

                      return (
                        <div
                          key={conversation._id}
                          onClick={() => handleConversationClick(conversation)}
                          className={`p-4 cursor-pointer transition-all duration-200 border-b border-slate-800/30 hover:bg-slate-800/30 ${
                            selectedConversation?._id === conversation._id
                              ? 'bg-slate-800/50 border-l-4 border-l-cyan-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={participant.profilePic} alt={participant.name} />
                                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                                  {participant.name?.charAt(0)?.toUpperCase() || participant.username?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {participant.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className={`font-semibold truncate ${
                                    conversation.unreadCount > 0 ? 'text-white' : 'text-slate-200'
                                  }`}>
                                    {participant.name || participant.username}
                                  </p>
                                  {participant.isVerified && (
                                    <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {getMessageStatusIcon(conversation)}
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-slate-400">
                                      {communityApiService.formatTimestamp(conversation.lastActivity)}
                                    </span>
                                    {conversation.unreadCount > 0 && (
                                      <Badge className="bg-cyan-500 text-white h-5 min-w-[20px] text-xs rounded-full flex items-center justify-center px-1.5">
                                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <p className={`text-sm truncate flex-1 ${
                                  conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'
                                }`}>
                                  {formatMessagePreview(conversation)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Load More Trigger */}
                    {hasMoreConversations && (
                      <div ref={loadMoreRef} className="p-4 flex justify-center">
                        {loading && (
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Error State */}
                {error && (
                  <div className="p-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                      <Button
                        onClick={() => fetchConversations(undefined, searchDebounced)}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Empty State for Desktop */}
          <div className="hidden md:flex flex-1 items-center justify-center bg-slate-950/50">
            <div className="text-center space-y-4 max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Select a conversation</h3>
              <p className="text-slate-400 text-lg">
                Choose a conversation from the list to start messaging, or create a new one.
              </p>
              <Button 
                onClick={handleNewConversation}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white mt-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}