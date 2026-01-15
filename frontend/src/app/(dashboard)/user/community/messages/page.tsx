"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConnectionStatus } from "@/components/ui/connection-status"
import { Search, Plus, MessageCircle, Loader2, Settings, MailPlus } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { ConversationResponse } from '@/types/user/community.types'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'
import { communityApiService } from '@/services/communityApiService'

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
    socketConnected,
    fetchConversations,
    loadMoreConversations,
    markMessagesAsRead,
    clearError
  } = useChat()

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchConversations(undefined, searchDebounced)
  }, [searchDebounced, fetchConversations])

  useEffect(() => {
    if (inView && hasMoreConversations && !loading) {
      loadMoreConversations(searchDebounced)
    }
  }, [inView, hasMoreConversations, loading, loadMoreConversations, searchDebounced])

  const handleConversationClick = useCallback(async (conversation: ConversationResponse) => {
    setSelectedConversation(conversation)
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation._id)
    }
    const otherParticipant = conversation.participants[0]
    if (otherParticipant?.username) {
      router.push(`/user/community/messages/${otherParticipant.username}`)
    }
  }, [router, markMessagesAsRead])

  const handleNewConversation = () => {
    toast.info('New conversation feature coming soon')
  }

  // Helper to format timestamps and previews...
  // (Simplified for brevity in this rewrite, assuming helpers exist or inline)

  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full">
      {/* List Column */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-800 flex flex-col h-full bg-slate-950">
        {/* Header */}
        <div className="p-3 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white px-2">Messages</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => { }} className="rounded-full hover:bg-slate-900">
              <Settings className="h-5 w-5 text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNewConversation} className="rounded-full hover:bg-slate-900">
              <MailPlus className="h-5 w-5 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search Direct Messages"
              className="pl-10 bg-slate-900 border-none rounded-full h-10 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-500" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <h3 className="text-xl font-bold text-white mb-2">Welcome to your inbox!</h3>
                <p className="mb-4">Drop a line, share Tweets and more with private conversations between you and others on ChainVerse.</p>
                <Button onClick={handleNewConversation} className="bg-cyan-500 rounded-full font-bold">Write a message</Button>
              </div>
            ) : (
              conversations.map(conv => {
                const p = conv.participants[0];
                if (!p) return null;
                const isSelected = selectedConversation?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleConversationClick(conv)}
                    className={`
                                  flex gap-3 p-4 cursor-pointer hover:bg-slate-900/50 transition-colors border-r-2
                                  ${isSelected ? 'bg-slate-900/50 border-cyan-500' : 'border-transparent'}
                               `}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={p.profilePic} />
                      <AvatarFallback>{p.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1 font-bold text-slate-200 truncate">
                          <span className="truncate">{p.name || p.username}</span>
                          <span className="text-slate-500 font-normal ml-1">@{p.username}</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                          {communityApiService.formatTimestamp(conv.lastActivity)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-slate-500'}`}>
                        {conv.lastMessage?.content || 'Sent an attachment'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area (Empty State for Root) */}
      <div className="hidden md:flex flex-1 items-center justify-center border-r border-slate-800 bg-slate-950">
        <div className="text-center max-w-sm px-8">
          <h2 className="text-3xl font-bold text-white mb-2">Select a message</h2>
          <p className="text-slate-500 mb-6">Choose from your existing conversations, start a new one, or just keep swimming.</p>
          <Button onClick={handleNewConversation} className="bg-cyan-500 hover:bg-cyan-600 rounded-full px-8 py-6 text-lg font-bold">New message</Button>
        </div>
      </div>
    </div>
  )
}