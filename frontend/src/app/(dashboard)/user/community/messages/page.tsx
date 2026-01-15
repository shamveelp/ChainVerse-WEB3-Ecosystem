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
    <div className="w-full min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-2xl border-x border-slate-800 flex flex-col min-h-screen bg-slate-950">
        {/* Header */}
        <div className="px-3 pb-3 pt-[29px] flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white px-2">Messages</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => { }} className="rounded-full hover:bg-slate-900 text-slate-400 hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNewConversation} className="rounded-full hover:bg-slate-900 text-slate-400 hover:text-white">
              <MailPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
            <Input
              placeholder="Search Direct Messages"
              className="pl-10 bg-slate-900 border-none rounded-full h-10 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-500 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col pb-20">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-500 h-8 w-8" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 mt-10">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailPlus className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to your inbox!</h3>
                <p className="mb-6 max-w-xs mx-auto">Drop a line, share Tweets and more with private conversations between you and others on ChainVerse.</p>
                <Button onClick={handleNewConversation} className="bg-cyan-500 hover:bg-cyan-600 rounded-full font-bold px-8 h-12 text-lg">
                  Write a message
                </Button>
              </div>
            ) : (
              conversations.map(conv => {
                const p = conv.participants[0];
                if (!p) return null;
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleConversationClick(conv)}
                    className="flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-900/50 transition-all border-b border-slate-800/50 last:border-0 group relative overflow-hidden"
                  >
                    <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-slate-700 transition-all shrink-0">
                      <AvatarImage src={p.profilePic} />
                      <AvatarFallback className="bg-slate-800 text-slate-300 font-bold">{p.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1 font-bold text-slate-200 truncate min-w-0">
                          <span className="truncate">{p.name || p.username}</span>
                          {p.isVerified && (
                            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 ml-2 whitespace-nowrap font-medium shrink-0">
                          {communityApiService.formatTimestamp(conv.lastActivity)}
                        </span>
                      </div>

                      <div className="text-sm text-slate-500 truncate mb-0.5">@{p.username}</div>

                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-300'}`}>
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
    </div>
  )
}