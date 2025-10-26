"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { communityAdminChatApiService, type CommunityGroupMessage } from "@/services/communityAdmin/communityAdminChatApiService"

interface Message extends CommunityGroupMessage {}

export default function CommunityChatsSection() {
  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)
  const token = useSelector((state: RootState) => state.communityAdminAuth?.token)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load messages
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!currentAdmin || !token) return

    try {
      if (reset) {
        setLoading(true)
        setMessages([])
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const cursor = reset ? undefined : nextCursor
      const response = await communityAdminChatApiService.getGroupMessages(cursor, 50)

      if (reset) {
        setMessages(response.messages)
      } else {
        setMessages(prev => [...response.messages, ...prev])
      }

      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)

    } catch (err: any) {
      console.error('Failed to load group messages:', err)
      setError(err.message || 'Failed to load messages')
      if (reset) {
        toast.error('Failed to load messages', {
          description: err.message || 'Please try again'
        })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentAdmin, token, nextCursor])

  // Initial load
  useEffect(() => {
    if (currentAdmin && token) {
      loadMessages(true)
    }
  }, [currentAdmin, token, loadMessages])

  // Socket setup
  useEffect(() => {
    if (!token || !currentAdmin) return

    const setupSocket = async () => {
      try {
        await communitySocketService.connect(token)

        // Join community for group chat
        if (currentAdmin.communityId) {
          communitySocketService.joinCommunity(currentAdmin.communityId)
        }

        // Listen for new group messages
        communitySocketService.onNewGroupMessage((data) => {
          console.log('New group message received:', data)
          setMessages(prev => [...prev, data.message])
          scrollToBottom()
        })

        // Listen for message sent confirmation
        communitySocketService.onGroupMessageSent((data) => {
          console.log('Group message sent confirmation:', data)
        })

        // Listen for typing indicators
        communitySocketService.onUserTypingStartGroup((data) => {
          if (data.userId !== currentAdmin._id) {
            setTypingUsers(prev => new Set([...prev, data.username]))
          }
        })

        communitySocketService.onUserTypingStopGroup((data) => {
          if (data.userId !== currentAdmin._id) {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.username)
              return newSet
            })
          }
        })

        // Listen for errors
        communitySocketService.onGroupMessageError((data) => {
          console.error('Group message error:', data)
          toast.error('Message Error', {
            description: data.error
          })
          setSending(false)
        })

      } catch (error: any) {
        console.error('Failed to setup socket:', error)
      }
    }

    setupSocket()

    return () => {
      communitySocketService.offNewGroupMessage()
      communitySocketService.offGroupMessageSent()
      communitySocketService.offUserTypingStartGroup()
      communitySocketService.offUserTypingStopGroup()
      communitySocketService.offGroupMessageError()
    }
  }, [token, currentAdmin?._id, currentAdmin?.communityId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending || !currentAdmin) return

    const messageContent = inputValue.trim()
    setInputValue("")
    setSending(true)

    try {
      // For admin, we need to send via API since they can't use the user sendGroupMessage
      // This would need a backend endpoint for admin group messages
      console.log('Admin trying to send group message:', messageContent)
      
      // For now, we'll use socket but this needs backend support
      // You'll need to add admin group message functionality
      toast.info('Admin group messaging not yet implemented')
      
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', {
        description: error.message
      })
      setInputValue(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      loadMessages(false)
    }
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Chat</h2>
          <p className="text-sm text-slate-400">Everyone can chat here</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-slate-400">Loading messages...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Chat</h2>
          <p className="text-sm text-slate-400">Everyone can chat here</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-white">Failed to load messages</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
            <Button onClick={() => loadMessages(true)} variant="outline" className="border-slate-600 hover:bg-slate-800">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Community Chat</h2>
        <p className="text-sm text-slate-400">Everyone can chat here</p>
      </div>

      {/* Messages Area - Fixed Height with Proper Scrolling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="space-y-4">
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pb-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-800 text-slate-300"
                  >
                    {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Load Earlier Messages
                  </Button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-sm text-slate-500">Be the first to start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message._id} className={`flex gap-3 ${message.isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.profilePic} alt={message.sender.name} />
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                          {message.sender.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${message.isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                      <div className={`flex items-baseline gap-2 px-3 ${message.isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="font-semibold text-white text-xs">
                          {message.isCurrentUser ? "You" : message.sender.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {communityAdminChatApiService.formatTime(message.createdAt)}
                        </span>
                        {message.isEdited && (
                          <span className="text-xs text-slate-500">(edited)</span>
                        )}
                      </div>
                      <div
                        className={`mt-1 px-3 py-2 rounded-lg break-words ${
                          message.isCurrentUser
                            ? "bg-cyan-600 text-white rounded-br-none"
                            : "bg-slate-800 text-slate-200 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicators */}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>
                    {Array.from(typingUsers).slice(0, 3).join(', ')}
                    {typingUsers.size > 3 && ` and ${typingUsers.size - 3} others`}
                    {typingUsers.size === 1 ? ' is' : ' are'} typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending}
            size="icon"
            className="bg-cyan-600 hover:bg-cyan-700 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          👀 Admin can view community group chat
        </p>
      </div>
    </div>
  )
}