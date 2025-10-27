"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { Send, Loader2, AlertCircle, Trash2 } from "lucide-react"
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
  console.log('Rendering CommunityChatsSection with admin:', token)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const socketSetupRef = useRef(false)
  const componentMountedRef = useRef(false)

  // Debug logs
  useEffect(() => {
    console.log('Community Chats Section Debug:', {
      currentAdmin: !!currentAdmin,
      token: !!token,
      adminId: currentAdmin?._id,
      loading,
      messagesCount: messages.length,
      error
    })
  }, [currentAdmin, token, loading, messages.length, error])

  // Load messages with better error handling
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!componentMountedRef.current) {
      console.log('Component not mounted, skipping loadMessages')
      return
    }

    if (!currentAdmin) {
      console.log('No currentAdmin, setting error')
      setError("Admin authentication required")
      setLoading(false)
      return
    }

    if (!token) {
      console.log('No token, setting error')
      setError("Authentication token required")
      setLoading(false)
      return
    }

    if (isLoadingRef.current) {
      console.log('Already loading, skipping')
      return
    }

    isLoadingRef.current = true

    try {
      console.log('Starting loadMessages (group):', { reset, cursor: reset ? undefined : nextCursor })

      if (reset) {
        setLoading(true)
        setMessages([])
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const cursor = reset ? undefined : nextCursor
      console.log('Calling getGroupMessages with cursor:', cursor)
      
      const response = await communityAdminChatApiService.getGroupMessages(cursor, 50)
      console.log('Group API response received:', {
        messagesCount: response?.messages?.length,
        hasMore: response?.hasMore,
        nextCursor: response?.nextCursor
      })

      if (!componentMountedRef.current) {
        console.log('Component unmounted during API call')
        return
      }

      if (reset) {
        setMessages(response.messages || [])
      } else {
        // Prepend older messages to the beginning
        setMessages(prev => [...(response.messages || []), ...prev])
      }
      
      setHasMore(response.hasMore || false)
      setNextCursor(response.nextCursor)
      setError(null) // Clear any previous errors

    } catch (err: any) {
      console.error('loadMessages (group) error:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
      
      if (!componentMountedRef.current) return

      const errorMessage = err?.message || 'Failed to load messages'
      setError(errorMessage)
      
      if (reset) {
        toast.error('Failed to load messages', {
          description: errorMessage
        })
      }
    } finally {
      if (componentMountedRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
      isLoadingRef.current = false
    }
  }, [currentAdmin, token, nextCursor])

  // Component mounted effect
  useEffect(() => {
    componentMountedRef.current = true
    return () => {
      componentMountedRef.current = false
    }
  }, [])

  // Initial load with dependency on admin and token
  useEffect(() => {
    console.log('Initial load effect triggered (group):', {
      currentAdmin: !!currentAdmin,
      token: !!token,
      isLoading: isLoadingRef.current
    })

    if (currentAdmin && token && !isLoadingRef.current) {
      loadMessages(true)
    } else if (!currentAdmin || !token) {
      console.log('Missing auth, setting appropriate error')
      setLoading(false)
      if (!currentAdmin) setError("Admin authentication required")
      else if (!token) setError("Authentication token required")
    }
  }, [currentAdmin?._id, token, loadMessages])

  // Socket setup
  useEffect(() => {
    if (!token || !currentAdmin || socketSetupRef.current) return

    const setupSocket = async () => {
      try {
        socketSetupRef.current = true
        console.log('Setting up admin socket for group chat')
        
        await communitySocketService.connect(token)
        console.log('Admin socket connected for group chat')

        // Listen for new group messages - avoid duplicate handling
        const handleNewGroupMessage = (data: any) => {
          console.log('New group message received:', data)
          if (!componentMountedRef.current) return

          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg._id === data.message._id)
            if (exists) {
              console.log('Message already exists, skipping:', data.message._id)
              return prev
            }
            return [...prev, data.message]
          })
          scrollToBottom()
        }

        const handleGroupMessageEdited = (data: any) => {
          console.log('Group message edited:', data)
          if (!componentMountedRef.current) return
          
          setMessages(prev => prev.map(msg =>
            msg._id === data.message._id ? data.message : msg
          ))
        }

        const handleGroupMessageDeleted = (data: any) => {
          console.log('Group message deleted:', data)
          if (!componentMountedRef.current) return
          
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId))
        }

        const handleUserTypingStartGroup = (data: any) => {
          if (data.userId !== currentAdmin._id && componentMountedRef.current) {
            setTypingUsers(prev => new Set([...prev, data.username]))
          }
        }

        const handleUserTypingStopGroup = (data: any) => {
          if (data.userId !== currentAdmin._id && componentMountedRef.current) {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.username)
              return newSet
            })
          }
        }

        const handleGroupMessageError = (data: any) => {
          console.error('Group message error:', data)
          if (!componentMountedRef.current) return
          
          toast.error('Message Error', {
            description: data.error
          })
        }

        // Remove existing listeners first to prevent duplicates
        communitySocketService.offNewGroupMessage()
        communitySocketService.offGroupMessageEdited()
        communitySocketService.offGroupMessageDeleted()
        communitySocketService.offUserTypingStartGroup()
        communitySocketService.offUserTypingStopGroup()
        communitySocketService.offGroupMessageError()

        // Add new listeners
        communitySocketService.onNewGroupMessage(handleNewGroupMessage)
        communitySocketService.onGroupMessageEdited(handleGroupMessageEdited)
        communitySocketService.onGroupMessageDeleted(handleGroupMessageDeleted)
        communitySocketService.onUserTypingStartGroup(handleUserTypingStartGroup)
        communitySocketService.onUserTypingStopGroup(handleUserTypingStopGroup)
        communitySocketService.onGroupMessageError(handleGroupMessageError)

      } catch (error: any) {
        console.error('Failed to setup admin socket for group chat:', error)
        socketSetupRef.current = false
        // Don't show error toast for socket issues as they're not critical for viewing
      }
    }

    setupSocket()

    return () => {
      socketSetupRef.current = false
      communitySocketService.offNewGroupMessage()
      communitySocketService.offGroupMessageEdited()
      communitySocketService.offGroupMessageDeleted()
      communitySocketService.offUserTypingStartGroup()
      communitySocketService.offUserTypingStopGroup()
      communitySocketService.offGroupMessageError()
    }
  }, [token, currentAdmin?._id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor && !isLoadingRef.current) {
      loadMessages(false)
    }
  }

  // Admin delete group message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await communityAdminChatApiService.deleteGroupMessage(messageId)
      // Also emit socket event for real-time deletion
      if (currentAdmin?.communityId) {
        communitySocketService.adminDeleteGroupMessage(messageId, currentAdmin.communityId)
      }
      toast.success('Message deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete group message:', error)
      toast.error('Failed to delete message', {
        description: error.message
      })
    }
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Chat</h2>
          <p className="text-sm text-slate-400">👀 Admin can view community group chat</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-slate-400">Loading messages...</p>
            <p className="text-xs text-slate-500">
              Admin: {currentAdmin ? '✓' : '✗'} | Token: {token ? '✓' : '✗'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Chat</h2>
          <p className="text-sm text-slate-400">👀 Admin can view community group chat</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-white">Failed to load messages</p>
              <p className="text-sm text-slate-400">{error}</p>
              <p className="text-xs text-slate-500 mt-2">
                Admin: {currentAdmin ? '✓' : '✗'} | Token: {token ? '✓' : '✗'}
              </p>
            </div>
            <Button 
              onClick={() => loadMessages(true)} 
              variant="outline" 
              className="border-slate-600 hover:bg-slate-800"
            >
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
        <p className="text-sm text-slate-400">👀 Admin can view community group chat • Can delete messages</p>
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
                  <p className="text-sm text-slate-500">Community members will chat here</p>
                </div>
              ) : (
                messages.map((message) => {
                  // Fix the message positioning - community members on left, admin always sees them as "others"
                  const isCurrentUser = false // Admin is always viewing other users' messages
                  return (
                    <div key={message._id} className="flex gap-3 group">
                      {/* Avatar - Always on left for group chat messages */}
                      <div className="flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender.profilePic} alt={message.sender.name} />
                          <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                            {message.sender.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Message Bubble - Always left-aligned for group chat */}
                      <div className="flex flex-col items-start max-w-[70%]">
                        <div className="flex items-baseline gap-2 px-3">
                          <span className="font-semibold text-white text-xs">
                            {message.sender.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {communityAdminChatApiService.formatTime(message.createdAt)}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs text-slate-500">(edited)</span>
                          )}

                          {/* Admin Delete Button */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteMessage(message._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 px-3 py-2 rounded-lg rounded-bl-none bg-slate-800 text-slate-200 break-words">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
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

      {/* Read-only notice */}
      <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 opacity-50 pointer-events-none">
          <Input
            placeholder="Admin read-only view - members chat here"
            disabled
            className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <Button disabled size="icon" className="bg-cyan-600 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          👀 Admin can view and delete messages but cannot send messages in group chat
        </p>
      </div>
    </div>
  )
}