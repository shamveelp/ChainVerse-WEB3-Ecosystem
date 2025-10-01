"use client"

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Send, Phone, Video, MoveHorizontal as MoreHorizontal, Loader as Loader2, CreditCard as Edit3, Trash2, Copy, CheckCheck, Check, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import { useChat } from '@/hooks/useChat'
import { communityApiService, ConversationResponse, MessageResponse } from '@/services/communityApiService'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

interface ChatPageProps {
  params: Promise<{
    username: string
  }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username } = resolvedParams

  const [conversation, setConversation] = useState<ConversationResponse | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const {
    conversations,
    messages,
    loading,
    sendingMessage,
    error,
    hasMoreMessages,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    getOrCreateConversation,
    joinConversation,
    leaveConversation,
    loadMoreMessages,
    clearError
  } = useChat()

  // Intersection observer for infinite scroll (load older messages)
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Get current conversation and messages
  const currentConversation = conversation
  const currentMessages = currentConversation ? messages[currentConversation._id] || [] : []

  // Initialize conversation
  useEffect(() => {
    let mounted = true

    const initConversation = async () => {
      try {
        setIsInitialLoading(true)
        const conv = await getOrCreateConversation(username)
        
        if (!mounted) return
        
        setConversation(conv)
        
        // Join socket room
        joinConversation(conv._id)
        
        // Fetch messages
        await fetchMessages(conv._id)
        
        // Mark as read
        if (conv.unreadCount > 0) {
          await markMessagesAsRead(conv._id)
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error)
      } finally {
        if (mounted) {
          setIsInitialLoading(false)
        }
      }
    }

    initConversation()

    return () => {
      mounted = false
      if (currentConversation) {
        leaveConversation(currentConversation._id)
      }
    }
  }, [username, getOrCreateConversation, joinConversation, leaveConversation, fetchMessages, markMessagesAsRead])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !loading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages, loading])

  // Load more messages when scrolling up
  useEffect(() => {
    if (inView && currentConversation && hasMoreMessages[currentConversation._id] && !loading) {
      const scrollContainer = messagesContainerRef.current
      const previousScrollHeight = scrollContainer?.scrollHeight || 0
      
      loadMoreMessages(currentConversation._id).then(() => {
        // Maintain scroll position after loading older messages
        if (scrollContainer) {
          const newScrollHeight = scrollContainer.scrollHeight
          scrollContainer.scrollTop = newScrollHeight - previousScrollHeight
        }
      })
    }
  }, [inView, currentConversation, hasMoreMessages, loading, loadMoreMessages])

  // Handle send message
  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!newMessage.trim() || sendingMessage) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX

    try {
      await sendMessage(username, messageContent)
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      // Restore message on error
      setNewMessage(messageContent)
    }
  }, [newMessage, sendingMessage, sendMessage, username])

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle message edit
  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentConversation || !content.trim()) return

    try {
      await editMessage(messageId, content.trim(), currentConversation._id)
      setEditingMessage(null)
      setEditContent('')
      toast.success('Message edited')
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }, [currentConversation, editMessage])

  // Handle message delete
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!currentConversation) return

    try {
      await deleteMessage(messageId, currentConversation._id)
      setShowDeleteDialog(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }, [currentConversation, deleteMessage])

  // Handle copy message
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied')
  }, [])

  // Start editing message
  const startEditingMessage = useCallback((message: MessageResponse) => {
    setEditingMessage({ id: message._id, content: message.content })
    setEditContent(message.content)
  }, [])

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingMessage(null)
    setEditContent('')
  }, [])

  // Get message status icon
  const getMessageStatusIcon = (message: MessageResponse) => {
    if (!message.isOwnMessage) return null

    const isRead = message.readBy.length > 1 // More than just sender
    
    if (isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    } else {
      return <Check className="h-3 w-3 text-slate-400" />
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push('/user/community/messages')
  }

  // Format timestamp for messages
  const formatMessageTime = (date: Date | string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  // Loading state
  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen flex items-center justify-center pt-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
            <p className="text-slate-400">Loading conversation...</p>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  // Error state
  if (error && !currentConversation) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen flex items-center justify-center pt-16">
          <div className="text-center space-y-4">
            <p className="text-red-400">{error}</p>
            <Button onClick={() => router.push('/user/community/messages')} variant="outline">
              Back to Messages
            </Button>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  const participant = currentConversation?.participants[0]

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen flex flex-col pt-16">
        {/* Chat Header - Fixed */}
        <div className="fixed top-16 left-0 right-0 lg:ml-80 xl:mr-80 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-slate-400 hover:text-white md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Avatar className="w-10 h-10">
                <AvatarImage src={participant?.profilePic} alt={participant?.name} />
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                  {participant?.name?.charAt(0)?.toUpperCase() || participant?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-white">
                    {participant?.name || participant?.username || username}
                  </h3>
                  {participant?.isVerified && (
                    <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-400">
                  {participant?.isOnline ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Video className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => router.push(`/user/community/${participant?.username}`)}
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                    Report User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pt-16 pb-20" ref={messagesContainerRef}>
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            {/* Load More Trigger */}
            {currentConversation && hasMoreMessages[currentConversation._id] && (
              <div ref={loadMoreRef} className="flex justify-center py-2">
                {loading && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading older messages...</span>
                  </div>
                )}
              </div>
            )}

            {currentMessages.map((message, index) => {
              const isOwnMessage = message.isOwnMessage
              const showAvatar = !isOwnMessage && (
                index === 0 || 
                currentMessages[index - 1]?.isOwnMessage || 
                currentMessages[index - 1]?.sender._id !== message.sender._id
              )

              return (
                <div
                  key={message._id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwnMessage && (
                    <div className="w-8 flex justify-center">
                      {showAvatar ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender.profilePic} alt={message.sender.name} />
                          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm">
                            {message.sender.name?.charAt(0)?.toUpperCase() || message.sender.username?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
                  )}

                  <div className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg group",
                    isOwnMessage ? "order-2" : "order-1"
                  )}>
                    {editingMessage?.id === message._id ? (
                      // Edit mode
                      <div className="bg-slate-800 rounded-2xl p-3 border border-slate-600">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-transparent border-none resize-none text-white placeholder:text-slate-400 p-0 min-h-[60px]"
                          placeholder="Edit your message..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleEditMessage(message._id, editContent)
                            } else if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-600">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="text-slate-400 hover:text-white h-7 px-3"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditMessage(message._id, editContent)}
                            disabled={!editContent.trim() || editContent === message.content}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white h-7 px-3"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal message
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            className={cn(
                              "relative rounded-2xl px-4 py-3 cursor-pointer transition-all duration-200",
                              isOwnMessage
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                                : "bg-slate-800 text-white hover:bg-slate-700"
                            )}
                          >
                            {message.isDeleted ? (
                              <p className="text-sm italic opacity-60">This message was deleted</p>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
                          </div>
                        </DropdownMenuTrigger>
                        
                        {!message.isDeleted && (
                          <DropdownMenuContent 
                            align={isOwnMessage ? "end" : "start"}
                            className="bg-slate-800 border-slate-700"
                          >
                            <DropdownMenuItem 
                              onClick={() => handleCopyMessage(message.content)}
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            
                            {isOwnMessage && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => startEditingMessage(message)}
                                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setShowDeleteDialog(message._id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    )}

                    {/* Message info */}
                    <div className={cn(
                      "flex items-center gap-2 mt-1 px-1",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-xs text-slate-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {message.editedAt && (
                        <span className="text-xs text-slate-400">
                          (edited)
                        </span>
                      )}
                      {getMessageStatusIcon(message)}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input Area - Fixed at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:ml-80 xl:mr-80 bg-slate-900/50 border-t border-slate-700/50 p-4 z-20">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Message ${participant?.name || participant?.username || username}...`}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 resize-none min-h-[44px] max-h-[120px] py-3"
                  maxLength={2000}
                  disabled={sendingMessage}
                />
                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                  {newMessage.length}/2000
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed px-6"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Message</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => showDeleteDialog && handleDeleteMessage(showDeleteDialog)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}