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

interface Message extends CommunityGroupMessage { }

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const socketSetupRef = useRef(false)
  const messageSentRef = useRef<Set<string>>(new Set())

  // Load messages
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!username || !currentUser || isLoadingRef.current) return

    isLoadingRef.current = true

    try {
      if (reset) {
        setLoading(true)
        setMessages([])
        setError(null)
        messageSentRef.current.clear()
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

    } catch (err: unknown) {
      console.error('Failed to load group messages:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      if (reset) {
        toast.error('Failed to load messages', {
          description: errorMessage
        })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [username, currentUser, nextCursor])

  // Initial load
  useEffect(() => {
    if (username && currentUser && !isLoadingRef.current) {
      loadMessages(true)
    }
  }, [username, currentUser])

  // Socket setup
  useEffect(() => {
    if (!token || !username || !currentUser || socketSetupRef.current) return

    const setupSocket = async () => {
      try {
        socketSetupRef.current = true
        await communitySocketService.connect(token)
        console.log('User socket connected for group chat')

        // Join community if we have the ID
        if (communityId) {
          communitySocketService.joinCommunity(communityId)
        }

        // Listen for new group messages - avoid duplicate handling
        const handleNewGroupMessage = (data: { message: CommunityGroupMessage }) => {
          console.log('New group message received:', data)
          const messageId = data.message._id

          // Check if we've already processed this message
          if (messageSentRef.current.has(messageId)) {
            console.log('Message already processed, skipping:', messageId)
            return
          }

          messageSentRef.current.add(messageId)

          setMessages(prev => {
            // Double check to prevent duplicates in state
            const exists = prev.some(msg => msg._id === messageId)
            if (exists) {
              console.log('Message already exists in state, skipping:', messageId)
              return prev
            }
            return [...prev, data.message]
          })

          scrollToBottom()
        }

        const handleGroupMessageSent = (data: { message: CommunityGroupMessage }) => {
          console.log('Group message sent confirmation:', data)
          // Don't add to state here as it should already be added by handleNewGroupMessage
          setSending(false)
        }

        const handleGroupMessageEdited = (data: { message: CommunityGroupMessage }) => {
          console.log('Group message edited:', data)
          setMessages(prev => prev.map(msg =>
            msg._id === data.message._id ? data.message : msg
          ))
        }

        const handleGroupMessageDeleted = (data: { messageId: string }) => {
          console.log('Group message deleted:', data)
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId))
          messageSentRef.current.delete(data.messageId)
        }

        const handleUserTypingStartGroup = (data: { userId: string; username: string }) => {
          if (data.userId !== currentUser._id) {
            setTypingUsers(prev => new Set([...prev, data.username]))
          }
        }

        const handleUserTypingStopGroup = (data: { userId: string; username: string }) => {
          if (data.userId !== currentUser._id) {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.username)
              return newSet
            })
          }
        }

        const handleGroupMessageError = (data: { error: string }) => {
          console.error('Group message error:', data)
          toast.error('Message Error', {
            description: data.error
          })
          setSending(false)
        }

        // Remove existing listeners first to prevent duplicates
        communitySocketService.offNewGroupMessage()
        communitySocketService.offGroupMessageSent()
        communitySocketService.offGroupMessageEdited()
        communitySocketService.offGroupMessageDeleted()
        communitySocketService.offUserTypingStartGroup()
        communitySocketService.offUserTypingStopGroup()
        communitySocketService.offGroupMessageError()

        // Add new listeners
        communitySocketService.onNewGroupMessage(handleNewGroupMessage)
        communitySocketService.onGroupMessageSent(handleGroupMessageSent)
        communitySocketService.onGroupMessageEdited(handleGroupMessageEdited)
        communitySocketService.onGroupMessageDeleted(handleGroupMessageDeleted)
        communitySocketService.onUserTypingStartGroup(handleUserTypingStartGroup)
        communitySocketService.onUserTypingStopGroup(handleUserTypingStopGroup)
        communitySocketService.onGroupMessageError(handleGroupMessageError)

      } catch (error: unknown) {
        console.error('Failed to setup socket:', error)
        socketSetupRef.current = false
      }
    }

    setupSocket()

    return () => {
      socketSetupRef.current = false
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
    } catch (error: unknown) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : "Unknown error"
      })
      setInputValue(messageContent) // Restore message
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
    if (hasMore && !loadingMore && nextCursor && !isLoadingRef.current) {
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
      typingTimeoutRef.current = null
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
                    disabled={loadingMore || isLoadingRef.current}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-800 text-slate-300"
                  >
                    {(loadingMore || isLoadingRef.current) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                messages.map((message) => {
                  // Fix message positioning - current user on right, others on left
                  const isCurrentUser = message.sender._id === currentUser?._id

                  return (
                    <div key={message._id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {/* Avatar - Show on left for others, right for current user */}
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.sender.profilePic} alt={message.sender.name} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {userCommunityChatApiService.getUserAvatarFallback(message.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                        <div className={`flex items-baseline gap-2 px-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="font-semibold text-white text-xs">
                            {isCurrentUser ? "You" : message.sender.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {userCommunityChatApiService.formatTime(message.createdAt)}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs text-slate-500">(edited)</span>
                          )}
                        </div>
                        <div
                          className={`mt-1 px-3 py-2 rounded-lg break-words ${isCurrentUser
                              ? "bg-cyan-600 text-white rounded-br-none"
                              : "bg-slate-800 text-slate-200 rounded-bl-none"
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>

                      {/* Avatar for current user on the right */}
                      {isCurrentUser && (
                        <div className="flex-shrink-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={currentUser?.profileImage} alt={currentUser?.name} />
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                              {userCommunityChatApiService.getUserAvatarFallback(currentUser?.name || '')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  )
                })
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