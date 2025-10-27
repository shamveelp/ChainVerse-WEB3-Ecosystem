"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { ReactionPicker } from "./reaction-picker"
import { MessageBubble } from "./message-bubble"
import { MediaViewer } from "./media-viewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Pin, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { userCommunityChatApiService, type CommunityChannelMessage } from "@/services/userCommunityServices/userCommunityChatApiService"

interface Message extends CommunityChannelMessage {}

export function CommunityView() {
  const params = useParams()
  const username = params?.username as string
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [selectedMedia, setSelectedMedia] = useState<any>(null)
  const [communityId, setCommunityId] = useState<string | null>(null)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  // Load messages
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!username || !currentUser || isLoadingRef.current) return

    isLoadingRef.current = true

    try {
      if (reset) {
        setLoading(true)
        setMessages([])
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const cursor = reset ? undefined : nextCursor
      const response = await userCommunityChatApiService.getChannelMessages(username, cursor, 20)

      if (reset) {
        // For channel messages, we want newest at bottom, so reverse the array
        const reversedMessages = [...(response.messages || [])].reverse()
        setMessages(reversedMessages)
        // Get community ID from first message
        if (reversedMessages.length > 0) {
          setCommunityId(reversedMessages[0].communityId)
        }
      } else {
        // For load more, prepend older messages (which come reversed from API)
        const reversedOlderMessages = [...(response.messages || [])].reverse()
        setMessages(prev => [...reversedOlderMessages, ...prev])
      }

      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)

    } catch (err: any) {
      console.error('Failed to load channel messages:', err)
      setError(err.message || 'Failed to load messages')
      if (reset) {
        toast.error('Failed to load messages', {
          description: err.message || 'Please try again'
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
    if (username && currentUser) {
      loadMessages(true)
    }
  }, [username, currentUser])

  // Socket setup
  useEffect(() => {
    if (!token || !username) return

    const setupSocket = async () => {
      try {
        await communitySocketService.connect(token)
        console.log('User socket connected for channel messages')

        // Join community if we have the ID
        if (communityId) {
          communitySocketService.joinCommunity(communityId)
        }

        // Listen for new channel messages
        communitySocketService.onNewChannelMessage((data) => {
          console.log('New channel message received:', data)
          // Add new message at the end (bottom) for channel messages
          setMessages(prev => [...prev, data.message])
        })

        // Listen for reaction updates
        communitySocketService.onMessageReactionUpdated((data) => {
          console.log('Message reaction updated:', data)
          setMessages(prev => prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          ))
        })

        // Listen for errors
        communitySocketService.onMessageError((data) => {
          console.error('Message error:', data)
          toast.error('Message Error', {
            description: data.error
          })
        })

        communitySocketService.onReactionError((data) => {
          console.error('Reaction error:', data)
          toast.error('Reaction Error', {
            description: data.error
          })
        })

      } catch (error: any) {
        console.error('Failed to setup socket:', error)
      }
    }

    setupSocket()

    return () => {
      communitySocketService.offNewChannelMessage()
      communitySocketService.offMessageReactionUpdated()
      communitySocketService.offMessageError()
      communitySocketService.offReactionError()
    }
  }, [token, username, communityId])

  // Join community when we get the ID
  useEffect(() => {
    if (communityId && communitySocketService.isConnected()) {
      communitySocketService.joinCommunity(communityId)
    }
  }, [communityId])

  // Scroll to bottom for new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m._id === messageId)
      if (!message) return

      const existingReaction = message.reactions.find(r => r.emoji === emoji)
      const userReacted = existingReaction?.userReacted

      let result
      if (userReacted) {
        result = await userCommunityChatApiService.removeChannelMessageReaction(messageId, emoji)
      } else {
        result = await userCommunityChatApiService.reactToChannelMessage(messageId, emoji)
      }

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, reactions: result.reactions }
          : msg
      ))

      setSelectedMessageId(null)
    } catch (error: any) {
      console.error('Reaction error:', error)
      toast.error('Failed to update reaction', {
        description: error.message
      })
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor && !isLoadingRef.current) {
      loadMessages(false)
    }
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Channel</h2>
          <p className="text-sm text-slate-400">Admin only • Read-only for members</p>
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
          <h2 className="text-lg font-semibold text-white">Community Channel</h2>
          <p className="text-sm text-slate-400">Admin only • Read-only for members</p>
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
        <h2 className="text-lg font-semibold text-white">Community Channel</h2>
        <p className="text-sm text-slate-400">Admin only • Read-only for members</p>
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
                  <p className="text-sm text-slate-500">Community admins will post updates here</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message._id} className="flex gap-3 group">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={message.admin.profilePicture} alt={message.admin.name} />
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {userCommunityChatApiService.getUserAvatarFallback(message.admin.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{message.admin.name}</span>
                        {message.isPinned && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {userCommunityChatApiService.formatTime(message.createdAt)}
                        </span>
                        {message.isEdited && (
                          <span className="text-xs text-slate-500">(edited)</span>
                        )}
                      </div>

                      {/* Text Content */}
                      {message.content && (
                        <p className="text-slate-200 text-sm mb-2 break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}

                      {/* Media Content */}
                      {message.mediaFiles && message.mediaFiles.length > 0 && (
                        <div className="grid gap-2 mb-2" style={{
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

                      {/* Reactions */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.reactions.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                              reaction.userReacted
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                            onClick={() => handleReaction(message._id, reaction.emoji)}
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}

                        {/* Add Reaction Button */}
                        <div className="relative">
                          <button
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-xs opacity-0 group-hover:opacity-100 text-slate-400"
                            onClick={() => setSelectedMessageId(selectedMessageId === message._id ? null : message._id)}
                          >
                            +
                          </button>

                          {/* Reaction Picker */}
                          {selectedMessageId === message._id && (
                            <ReactionPicker
                              onSelectReaction={(emoji) => handleReaction(message._id, emoji)}
                              onClose={() => setSelectedMessageId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Disabled Input Area - Fixed at Bottom */}
      <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 opacity-50 pointer-events-none">
          <input
            type="text"
            placeholder="Only admins can post in this channel"
            disabled
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 text-slate-200 text-sm placeholder-slate-500 border border-slate-600"
          />
          <button disabled className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium">
            Send
          </button>
        </div>
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