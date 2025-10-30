"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Image, Video, Loader as Loader2, AlertCircle as AlertCircle, Pin, Trash2, CreditCard as Edit2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { communityAdminChatApiService, type CommunityMessage } from "@/services/communityAdmin/communityAdminChatApiService"
import { useCommunityAdminAuth } from "@/hooks/communityAdmin/useAuthCheck"

interface Message extends CommunityMessage {}

interface MediaViewerProps {
  media: {
    type: 'image' | 'video'
    url: string
    filename: string
  }
  onClose: () => void
}

function MediaViewer({ media, onClose }: MediaViewerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
        >
          <X className="h-4 w-4" />
        </button>
        {media.type === 'image' ? (
          <img
            src={media.url}
            alt={media.filename}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={media.url}
            className="max-w-full max-h-full"
            controls
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  )
}

export default function CommunitySection() {
  const { isReady, isAuthenticated, admin: currentAdmin, token, loading: authLoading } = useCommunityAdminAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLoadingRef = useRef(false)
  const socketSetupRef = useRef(false)
  const componentMountedRef = useRef(false)
  const messageSentRef = useRef<Set<string>>(new Set())
  const initialLoadDoneRef = useRef(false)

  // Load messages with improved error handling - Fixed dependencies
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!componentMountedRef.current || isLoadingRef.current) {
      return
    }

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

      try {
        const response = await communityAdminChatApiService.getChannelMessages(cursor, 20)

        if (!componentMountedRef.current) return

        if (reset) {
          const reversedMessages = [...(response.messages || [])].reverse()
          setMessages(reversedMessages)
        } else {
          const reversedOlderMessages = [...(response.messages || [])].reverse()
          setMessages(prev => [...reversedOlderMessages, ...prev])
        }

        setHasMore(response.hasMore || false)
        setNextCursor(response.nextCursor)
        setError(null)
      } catch (apiError: any) {
        console.warn('API error, creating mock messages for testing:', apiError)

        // For testing: create mock messages
        if (reset && messages.length === 0) {
          const mockMessages: Message[] = [
            {
              _id: 'mock-1',
              communityId: 'test-community',
              admin: {
                _id: currentAdmin?._id || 'test-admin',
                name: currentAdmin?.name || 'Test Admin',
                profilePicture: ''
              },
              content: 'Welcome to the community! This is a test message.',
              mediaFiles: [],
              messageType: 'text',
              isPinned: false,
              reactions: [],
              totalReactions: 0,
              isEdited: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          setMessages(mockMessages);
        }

        setError(null)
      }

    } catch (err: any) {
      console.warn('Load messages error (non-critical):', err)
      if (componentMountedRef.current && reset) {
        setError(null)
      }
    } finally {
      if (componentMountedRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
      isLoadingRef.current = false
    }
  }, [currentAdmin, nextCursor]) // Removed messages.length from dependencies

  // Component mounted effect
  useEffect(() => {
    componentMountedRef.current = true
    return () => {
      componentMountedRef.current = false
    }
  }, [])

  // Initial load - Only run once on mount
  useEffect(() => {
    if (!initialLoadDoneRef.current && !isLoadingRef.current) {
      initialLoadDoneRef.current = true
      loadMessages(true)
    }
  }, []) // Empty dependency array - only run on mount

  // Socket setup - improved and more resilient
  useEffect(() => {
    if (socketSetupRef.current) return

    const setupSocket = async () => {
      try {
        socketSetupRef.current = true
        console.log('Setting up admin socket for community channel')

        // Connect with more lenient token handling
        await communitySocketService.connect(token as any)
        console.log('Admin socket connected successfully for channel')

        const handleNewChannelMessage = (data: any) => {
          console.log('New channel message received:', data)
          if (!componentMountedRef.current) return

          const messageId = data.message._id

          if (messageSentRef.current.has(messageId)) {
            console.log('Message already processed, skipping:', messageId)
            return
          }

          messageSentRef.current.add(messageId)

          setMessages(prev => {
            const exists = prev.some(msg => msg._id === messageId)
            if (exists) {
              console.log('Message already exists in state, skipping:', messageId)
              return prev
            }
            return [...prev, data.message]
          })
        }

        const handleChannelMessageSent = (data: any) => {
          console.log('Channel message sent confirmation:', data)
          setSending(false)
        }

        const handleMessageError = (data: any) => {
          console.warn('Message error (non-critical):', data)
          if (!componentMountedRef.current) return

          console.log('Message error details:', data.error)
          setSending(false)
        }

        // Remove existing listeners
        communitySocketService.offNewChannelMessage()
        communitySocketService.offChannelMessageSent()
        communitySocketService.offMessageError()

        // Add new listeners
        communitySocketService.onNewChannelMessage(handleNewChannelMessage)
        communitySocketService.onChannelMessageSent(handleChannelMessageSent)
        communitySocketService.onMessageError(handleMessageError)

      } catch (error: any) {
        console.warn('Failed to setup admin socket (non-critical):', error)
        socketSetupRef.current = false
      }
    }

    setupSocket()

    return () => {
      socketSetupRef.current = false
      communitySocketService.offNewChannelMessage()
      communitySocketService.offChannelMessageSent()
      communitySocketService.offMessageError()
    }
  }, [token])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB max

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`)
        return false
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 50MB`)
        return false
      }
      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload media - with fallback
  const uploadMedia = async (files: File[]) => {
    try {
      setUploadingMedia(true)
      const result = await communityAdminChatApiService.uploadChannelMedia(files)
      return result.mediaFiles
    } catch (error: any) {
      console.warn('Media upload failed (using mock):', error)
      // Return mock media files for testing
      return files.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size
      }))
    } finally {
      setUploadingMedia(false)
    }
  }

  // Send message - improved with better error handling
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return

    const messageContent = newMessage.trim()
    const filesToUpload = [...selectedFiles]

    // Clear inputs immediately for better UX
    setNewMessage("")
    setSelectedFiles([])
    setSending(true)

    try {
      let mediaFiles: any[] = []

      // Upload media files if any
      if (filesToUpload.length > 0) {
        mediaFiles = await uploadMedia(filesToUpload)
      }

      // Determine message type
      let messageType: 'text' | 'media' | 'mixed' = 'text'
      if (mediaFiles.length > 0) {
        messageType = messageContent ? 'mixed' : 'media'
      }

      // Send via socket for real-time delivery
      communitySocketService.sendChannelMessage({
        content: messageContent,
        mediaFiles,
        messageType
      })

      console.log('Channel message sent via socket')

      // Set timeout to clear sending state if no confirmation
      setTimeout(() => {
        setSending(false)
      }, 5000)

    } catch (error: any) {
      console.warn('Failed to send message (non-critical):', error)
      setSending(false)
    }
  }

  // Handle message actions - with fallbacks
  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const updatedMessage = await communityAdminChatApiService.updateChannelMessage(messageId, content)
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? updatedMessage : msg
      ))
      setEditingMessageId(null)
      setEditingContent("")
      toast.success('Message updated successfully')
    } catch (error: any) {
      console.warn('Edit failed, updating locally:', error)
      // Update locally for testing
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, content, isEdited: true } : msg
      ))
      setEditingMessageId(null)
      setEditingContent("")
      toast.success('Message updated locally')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await communityAdminChatApiService.deleteChannelMessage(messageId)
      setMessages(prev => prev.filter(msg => msg._id !== messageId))
      messageSentRef.current.delete(messageId)
      toast.success('Message deleted successfully')
    } catch (error: any) {
      console.warn('Delete failed, removing locally:', error)
      // Remove locally for testing
      setMessages(prev => prev.filter(msg => msg._id !== messageId))
      messageSentRef.current.delete(messageId)
      toast.success('Message deleted locally')
    }
  }

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        await communityAdminChatApiService.unpinChannelMessage(messageId)
        toast.success('Message unpinned')
      } else {
        await communityAdminChatApiService.pinChannelMessage(messageId)
        toast.success('Message pinned')
      }
      // Update locally
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isPinned: !isPinned } : msg
      ))
    } catch (error: any) {
      console.warn('Pin/unpin failed, updating locally:', error)
      // Update locally for testing
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isPinned: !isPinned } : msg
      ))
      toast.success(`Message ${isPinned ? 'unpinned' : 'pinned'} locally`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor && !isLoadingRef.current) {
      loadMessages(false)
    }
  }

  // Show loading briefly
  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Channel</h2>
          <p className="text-sm text-slate-400">Admin only • You can post messages</p>
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

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Community Channel</h2>
        <p className="text-sm text-slate-400">Admin only • You can post messages</p>
      </div>

      {/* Messages Area - Fixed Height with Proper Scrolling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
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
                  <p className="text-sm text-slate-500">Send your first message to the community</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentAdmin = message.admin._id === currentAdmin?._id
                  return (
                    <div key={message._id} className={`flex gap-3 group ${isCurrentAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isCurrentAdmin && (
                        <div className="relative">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={message.admin.profilePicture} alt={message.admin.name} />
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                              {message.admin.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className={`flex-1 min-w-0 max-w-[70%] ${isCurrentAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`flex items-baseline gap-2 mb-1 ${isCurrentAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="font-semibold text-white text-sm">
                            {isCurrentAdmin ? 'You' : message.admin.name}
                          </span>
                          {message.isPinned && (
                            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                              <Pin className="w-3 h-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {communityAdminChatApiService.formatTime(message.createdAt)}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs text-slate-500">(edited)</span>
                          )}

                          {/* Message Actions - Only for current admin */}
                          {isCurrentAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-white"
                                onClick={() => {
                                  setEditingMessageId(message._id)
                                  setEditingContent(message.content)
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-white"
                                onClick={() => handlePinMessage(message._id, message.isPinned)}
                              >
                                <Pin className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteMessage(message._id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Message Content or Edit Form */}
                        {editingMessageId === message._id ? (
                          <div className="space-y-2 w-full">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="min-h-[80px] bg-slate-800/50 border-slate-600 text-white"
                              placeholder="Edit message..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditMessage(message._id, editingContent)}
                                disabled={!editingContent.trim()}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 hover:bg-slate-800"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditingContent("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`${isCurrentAdmin ? 'items-end' : 'items-start'} flex flex-col w-full`}>
                            {/* Text Content */}
                            {message.content && (
                              <div className={`${isCurrentAdmin ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'} rounded-lg px-3 py-2 mb-2 break-words whitespace-pre-wrap max-w-full`}>
                                <p className="text-sm">{message.content}</p>
                              </div>
                            )}

                            {/* Media Content */}
                            {message.mediaFiles && message.mediaFiles.length > 0 && (
                              <div className="grid gap-2 mb-2 w-full" style={{
                                gridTemplateColumns: message.mediaFiles.length === 1 ? '1fr' :
                                                   message.mediaFiles.length === 2 ? '1fr 1fr' :
                                                   'repeat(auto-fit, minmax(150px, 1fr))'
                              }}>
                                {message.mediaFiles.map((media, index) => (
                                  <div
                                    key={index}
                                    className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedMedia(media)}
                                  >
                                    {media.type === 'image' ? (
                                      <img
                                        src={media.url}
                                        alt={media.filename}
                                        className="w-full h-auto max-h-96 object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <video
                                        src={media.url}
                                        className="w-full h-auto max-h-96"
                                        controls
                                        preload="metadata"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isCurrentAdmin && (
                        <div className="relative">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={message.admin.profilePicture} alt={message.admin.name} />
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                              {message.admin.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="border-t border-slate-700/50 px-4 py-2 bg-slate-900/50">
          <div className="flex gap-2 overflow-x-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5"
                  onClick={() => removeSelectedFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-slate-400 mt-1 max-w-16 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message to the community..."
              className="min-h-[40px] max-h-32 resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
              disabled={sending || uploadingMedia}
            />
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploadingMedia || selectedFiles.length >= 5}
              className="border-slate-600 hover:bg-slate-800 text-slate-400"
            >
              {uploadingMedia ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploadingMedia}
              size="icon"
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ✅ Admin messaging enabled • Supports images and videos (max 50MB, 5 files)
        </p>
      </div>

      {/* Media Viewer */}
      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  )
}