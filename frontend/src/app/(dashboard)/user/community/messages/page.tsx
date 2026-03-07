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
    typingUsers,
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
    <div className="w-full h-full flex justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="w-full max-w-5xl border-x border-slate-800/50 flex flex-col h-full bg-slate-950/40 relative backdrop-blur-sm shadow-2xl">
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col pb-20">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-500 h-8 w-8" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 mt-10">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-900/10 border border-slate-700/50">
                  <MailPlus className="h-10 w-10 text-cyan-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">Welcome to your inbox!</h3>
                <p className="mb-8 max-w-sm mx-auto text-slate-400 leading-relaxed">Drop a line, share updates, and connect instantly with private conversations on ChainVerse.</p>
                <Button onClick={handleNewConversation} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 rounded-full font-bold px-10 h-14 text-lg transition-all hover:scale-105 active:scale-95">
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
                    className="flex items-start gap-4 p-5 cursor-pointer hover:bg-slate-800/40 transition-all border-b border-slate-800/50 last:border-0 group relative overflow-hidden backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-colors duration-500" />
                    <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-cyan-500/50 shadow-lg transition-all shrink-0">
                      <AvatarImage src={p.profilePic} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 font-bold text-lg">{p.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1 font-bold text-slate-200 truncate min-w-0 text-[15px]">
                          <span className="truncate group-hover:text-cyan-400 transition-colors">{p.name || p.username}</span>
                          {p.isVerified && (
                            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-cyan-900/50">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {conv.unreadCount > 0 && (
                            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-cyan-900/40 min-w-[20px] text-center">
                              {conv.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 whitespace-nowrap font-medium group-hover:text-slate-400">
                            {communityApiService.formatTimestamp(conv.lastActivity)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[13px] text-slate-500 truncate mb-1">@{p.username}</div>

                      {typingUsers[conv._id] && typingUsers[conv._id].length > 0 ? (
                        <p className="text-[14px] text-emerald-400 font-medium truncate flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="ml-1 tracking-wide">{typingUsers[conv._id][0]} is typing...</span>
                        </p>
                      ) : (
                        <p className={`text-[14px] truncate ${conv.unreadCount > 0 ? 'text-white font-bold tracking-wide' : 'text-slate-400 group-hover:text-slate-300'}`}>
                          {conv.lastMessage?.content || 'Started a conversation'}
                        </p>
                      )}
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