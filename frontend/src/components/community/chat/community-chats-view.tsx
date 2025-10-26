"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { Send, Loader2, AlertCircle, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageBubble } from "./message-bubble"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { userCommunityChatApiService, type CommunityGroupMessage } from "@/services/userCommunityServices/userCommunityChatApiService"

interface Message extends CommunityGroupMessage {}

export function CommunityChatsView() {
  const params = useParams()
  const username = params?.username as string
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [communityId, setCommunityId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

  // Load messages
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!username || !currentUser) return

    try {
      if (reset) {
        setLoading(true)
        setMessages([])
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const cursor = reset ? undefined : nextCursor
      const response = await userCommunityChatApiService.getGroupMessages(username, cursor, 50)

      if (reset) {
        setMessages(response.messages)
        // Get community ID from first message
        if (response.messages.length > 0) {
          setCommunityId(response.messages[0].communityId)
        }
      } else {
        // Prepend older messages to the beginning
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
  }, [username, currentUser, nextCursor])

  // Initial load
  useEffect(() => {
    if (username && currentUser) {
      loadMessages(true)
    }
  }, [username, currentUser])

  // Socket setup
  useEffect(() => {
    if (!token || !username || !currentUser) return

    const setupSocket = async () => {
      try {
        await communitySocketService.connect(token)
        console.log('User socket connected for group chat')

        // Join community if we have the ID
        if (communityId) {
          communitySocketService.joinCommunity(communityId)
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
          // Message should already be in the list from onNewGroupMessage
        })

        // Listen for message edits
        communitySocketService.onGroupMessageEdited((data) => {
          console.log('Group message edited:', data)
          setMessages(prev => prev.map(msg =>
            msg._id === data.message._id ? data.message : msg
          ))
        })

        // Listen for message deletes
        communitySocketService.onGroupMessageDeleted((data) => {
          console.log('Group message deleted:', data)
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId))
        })

        // Listen for typing indicators
        communitySocketService.onUserTypingStartGroup((data) => {
          if (data.userId !== currentUser._id) {
            setTypingUsers(prev => new Set([...prev, data.username]))
          }
        })

        communitySocketService.onUserTypingStopGroup((data) => {
          if (data.userId !== currentUser._id) {
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
      communitySocketService.offGroupMessageEdited()
      communitySocketService.offGroupMessageDeleted()
      communitySocketService.offUserTypingStartGroup()
      communitySocketService.offUserTypingStopGroup()
      communitySocketService.offGroupMessageError()
    }
  }, [token, username, currentUser?._id, communityId])

  // Join community when we get the ID
  useEffect(() => {
    if (communityId && communitySocketService.isConnected()) {
      communitySocketService.joinCommunity(communityId)
    }
  }, [communityId])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending || !username || !currentUser) return

    const messageContent = inputValue.trim()
    setInputValue("")
    setSending(true)

    try {
      // Send via socket for real-time delivery
      communitySocketService.sendGroupMessage({
        communityUsername: username,
        content: messageContent
      })

      // Stop typing indicator
      handleStopTyping()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', {
        description: error.message
      })
      setInputValue(messageContent) // Restore message
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

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      loadMessages(false)
    }
  }

  // Typing indicators
  const handleStartTyping = () => {
    if (!isTyping && communityId) {
      setIsTyping(true)
      communitySocketService.startTypingGroup({ communityId })
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 3000)
  }

  const handleStopTyping = () => {
    if (isTyping && communityId) {
      setIsTyping(false)
      communitySocketService.stopTypingGroup({ communityId })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  // Input change handler with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (e.target.value.trim() && !isTyping) {
      handleStartTyping()
    } else if (!e.target.value.trim() && isTyping) {
      handleStopTyping()
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
                          {userCommunityChatApiService.getUserAvatarFallback(message.sender.name)}
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
                          {userCommunityChatApiService.formatTime(message.createdAt)}
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
            onChange={handleInputChange}
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
      </div>
    </div>
  )
}