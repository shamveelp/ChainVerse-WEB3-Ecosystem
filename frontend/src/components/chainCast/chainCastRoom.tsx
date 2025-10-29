"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  MessageCircle,
  PhoneOff,
  Crown,
  Loader2,
  Send,
  Hand,
  Clock,
  Heart
} from 'lucide-react'
import { RootState } from '@/redux/store'
import { useWebRTC } from '@/hooks/useWebRTC'
import { chainCastSocketService } from '@/services/socket/chainCastSocketService'
import { toast } from 'sonner'
import type { ChainCast } from '@/services/chainCast/userChainCastApiService'

interface ChainCastRoomProps {
  chainCast: ChainCast
  onLeave: () => void
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
}

interface FloatingReaction {
  id: string
  emoji: string
  username: string
  x: number
  y: number
}

const reactions = [
  { emoji: '👏', label: 'Clap' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💯', label: '100' }
]

export default function ChainCastRoom({ chainCast, onLeave }: ChainCastRoomProps) {
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)
  const token = useSelector((state: RootState) => state.userAuth?.token || state.communityAdminAuth?.token)

  // Determine user info and role
  const userInfo = currentUser || currentAdmin
  const isAdmin = !!currentAdmin || chainCast.userRole === 'admin'
  const userRole = isAdmin ? 'admin' : 'viewer'

  console.log('ChainCast Room - User Info:', {
    isAdmin,
    userRole,
    userName: userInfo?.name || userInfo?.username,
    chainCastId: chainCast._id
  })

  // State
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showModeratorRequest, setShowModeratorRequest] = useState(false)
  const [requestingSent, setRequestingSent] = useState(false)
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'reactions'>('participants')
  const [participantCount, setParticipantCount] = useState(1)
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])

  const chatScrollRef = useRef<HTMLDivElement>(null)

  // WebRTC hook
  const {
    localStream,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    isConnecting,
    isConnected,
    localVideoRef,
    initializeLocalStream,
    toggleVideo,
    toggleAudio,
    addParticipant,
    removeParticipant,
    updateParticipant,
    cleanup
  } = useWebRTC({
    maxParticipants: chainCast.maxParticipants,
    onParticipantJoined: (participant) => {
      toast.success(`User joined the ChainCast`)
    },
    onParticipantLeft: (userId) => {
      toast.info(`User left the ChainCast`)
    }
  })

  // Initialize ChainCast room
  useEffect(() => {
    let mounted = true

    const initializeRoom = async () => {
      if (!token || !chainCast || !mounted) {
        setLoading(false)
        return
      }

      try {
        console.log('Initializing ChainCast room...', {
          chainCastId: chainCast._id,
          userRole,
          isAdmin
        })

        // Connect to socket
        if (!chainCastSocketService.isConnected()) {
          await chainCastSocketService.connect(token)
        }

        if (!mounted) return

        // Setup socket listeners first
        setupSocketListeners()

        // Join ChainCast room
        await chainCastSocketService.joinChainCast(chainCast._id)
        if (mounted) {
          setIsJoined(true)
        }

        // Initialize media stream based on role
        if (isAdmin && mounted) {
          console.log('Admin: Initializing with video and audio')
          await initializeLocalStream(true, true)
        } else if (mounted) {
          console.log('Viewer: Initializing without media')
          await initializeLocalStream(false, false)
        }

      } catch (error: any) {
        console.error('Failed to initialize ChainCast room:', error)
        if (mounted) {
          toast.error('Failed to join ChainCast', {
            description: error.message || 'Please try again'
          })
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeRoom()

    return () => {
      mounted = false
      cleanup()
      if (isJoined && chainCast) {
        chainCastSocketService.leaveChainCast(chainCast._id)
      }
    }
  }, [chainCast._id, token, initializeLocalStream, cleanup, isAdmin])

  // Setup socket event listeners
  const setupSocketListeners = useCallback(() => {
    // Connection events
    chainCastSocketService.onJoinedChainCast((data) => {
      console.log('Joined ChainCast:', data)
      setParticipantCount(data.participantCount)
    })

    chainCastSocketService.onLeftChainCast((data) => {
      console.log('Left ChainCast:', data)
      setParticipantCount(data.participantCount)
    })

    // Participant events
    chainCastSocketService.onParticipantJoined((participant) => {
      console.log('Participant joined:', participant)
      addParticipant({
        userId: participant.userId,
        username: participant.username,
        userType: participant.userType || 'user',
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || true
      })
    })

    chainCastSocketService.onParticipantLeft((participant) => {
      console.log('Participant left:', participant)
      removeParticipant(participant.userId)
    })

    chainCastSocketService.onParticipantStreamUpdate((participant) => {
      console.log('Participant stream update:', participant)
      updateParticipant(participant.userId, {
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || false
      })
    })

    // Chat messages
    chainCastSocketService.onNewMessage((message: ChatMessage) => {
      setChatMessages(prev => {
        // Prevent duplicate messages
        if (prev.some(m => m.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
    })

    // Reaction events
    chainCastSocketService.onNewReaction((reaction) => {
      showFloatingReaction(reaction.emoji, reaction.username)
    })

    // Moderation events
    chainCastSocketService.onModerationRequested((data) => {
      toast.success('Moderation request sent to admin')
      setShowModeratorRequest(false)
      setRequestingSent(true)
    })

    chainCastSocketService.onModerationReviewed((data) => {
      if (data.status === 'approved') {
        toast.success(`Moderation approved by ${data.adminName}`)
        setRequestingSent(false)
      } else {
        toast.error(`Moderation rejected by ${data.adminName}`)
        setRequestingSent(false)
      }
    })

    // ChainCast control events
    chainCastSocketService.onChainCastStarted((data) => {
      toast.info(`ChainCast started by ${data.adminName}`)
    })

    chainCastSocketService.onChainCastEnded(() => {
      toast.info('ChainCast has ended')
      setTimeout(onLeave, 2000)
    })

    chainCastSocketService.onRemovedFromChainCast((data) => {
      toast.error(`Removed from ChainCast by ${data.adminName}`)
      setTimeout(onLeave, 1000)
    })

    // Error handlers
    chainCastSocketService.onError((data) => {
      toast.error(data.message)
    })

    chainCastSocketService.onJoinError((data) => {
      toast.error('Failed to join ChainCast', {
        description: data.error
      })
    })
  }, [addParticipant, removeParticipant, updateParticipant, onLeave])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Handle video toggle (admin only)
  const handleVideoToggle = useCallback(() => {
    if (!isAdmin) {
      toast.error('Only admin can control video')
      return
    }

    const enabled = toggleVideo()

    if (chainCastSocketService.isConnected()) {
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: enabled,
        hasAudio: isAudioEnabled,
        isMuted: !isAudioEnabled,
        isVideoOff: !enabled
      })
    }
  }, [toggleVideo, isAudioEnabled, chainCast._id, isAdmin])

  // Handle audio toggle (admin only)
  const handleAudioToggle = useCallback(() => {
    if (!isAdmin) {
      toast.error('Only admin can control audio')
      return
    }

    const enabled = toggleAudio()

    if (chainCastSocketService.isConnected()) {
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: isVideoEnabled,
        hasAudio: enabled,
        isMuted: !enabled,
        isVideoOff: !isVideoEnabled
      })
    }
  }, [toggleAudio, isVideoEnabled, chainCast._id, isAdmin])

  // Handle reaction
  const handleReaction = useCallback(async (emoji: string) => {
    try {
      if (chainCastSocketService.isConnected()) {
        chainCastSocketService.addReaction(chainCast._id, emoji)
      }
    } catch (error: any) {
      toast.error('Failed to send reaction')
    }
  }, [chainCast._id])

  // Handle moderation request
  const handleModerationRequest = useCallback(async () => {
    try {
      setRequestingSent(true)
      
      if (chainCastSocketService.isConnected()) {
        chainCastSocketService.requestModeration({
          chainCastId: chainCast._id,
          requestedPermissions: { video: false, audio: true },
          message: 'Requesting to speak'
        })
      }
      
      setShowModeratorRequest(false)
    } catch (error: any) {
      toast.error('Failed to send moderation request')
      setRequestingSent(false)
    }
  }, [chainCast._id])

  // Send chat message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // Send through socket for real-time chat
    if (chainCastSocketService.isConnected()) {
      chainCastSocketService.sendMessage(chainCast._id, newMessage.trim())
      setNewMessage('')
    }
  }, [newMessage, chainCast._id])

  // Show floating reaction
  const showFloatingReaction = useCallback((emoji: string, username: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const reaction: FloatingReaction = {
      id,
      emoji,
      username,
      x: Math.random() * (window.innerWidth - 100),
      y: window.innerHeight - 200
    }

    setFloatingReactions(prev => [...prev, reaction])

    // Remove after animation
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)

    // Show toast
    toast.info(`${username} reacted with ${emoji}`, { duration: 2000 })
  }, [])

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
          <p className="text-white text-lg">Joining ChainCast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Floating Reactions */}
      {floatingReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="fixed text-4xl pointer-events-none z-50 animate-bounce"
          style={{ left: reaction.x, top: reaction.y }}
        >
          {reaction.emoji}
        </div>
      ))}

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h1 className="text-xl font-bold text-white">{chainCast.title}</h1>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <Users className="h-4 w-4" />
              <span>{participantCount}/{chainCast.maxParticipants}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onLeave}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Admin Video (Large) */}
          <div className="h-full p-4">
            <Card className="bg-slate-900/50 border-slate-700/50 relative overflow-hidden h-full">
              <CardContent className="p-0 h-full relative">
                {isAdmin && localStream && isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <Avatar className="w-32 h-32 mx-auto mb-4">
                        <AvatarImage src={chainCast.admin.profilePicture} />
                        <AvatarFallback className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-4xl">
                          {chainCast.admin.name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <Crown className="h-6 w-6 text-yellow-400" />
                        <span className="text-white text-xl font-medium">{chainCast.admin.name}</span>
                      </div>
                      <p className="text-slate-400">Community Admin</p>
                    </div>
                  </div>
                )}

                {/* Stream Status Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-lg font-medium bg-black/50 px-3 py-1 rounded">
                      {isAdmin ? `${userInfo?.name} (You)` : chainCast.admin.name}
                    </span>
                    {isAdmin && <Crown className="h-5 w-5 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        {!isAudioEnabled && <MicOff className="h-5 w-5 text-red-400" />}
                        {!isVideoEnabled && <VideoOff className="h-5 w-5 text-red-400" />}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Controls (Bottom Center) */}
          {isAdmin && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl rounded-full px-6 py-3 border border-slate-700/50">
                <Button
                  onClick={handleAudioToggle}
                  size="icon"
                  className={`rounded-full ${
                    isAudioEnabled
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={handleVideoToggle}
                  size="icon"
                  className={`rounded-full ${
                    isVideoEnabled
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={onLeave}
                  size="icon"
                  className="rounded-full bg-red-600 hover:bg-red-700"
                  title="End ChainCast"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* User Controls (Bottom Center) */}
          {!isAdmin && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl rounded-full px-6 py-3 border border-slate-700/50">
                {!requestingSent && (
                  <Button
                    onClick={handleModerationRequest}
                    size="icon"
                    className="rounded-full bg-blue-600 hover:bg-blue-700"
                    title="Request to speak"
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                )}

                {requestingSent && (
                  <Button
                    disabled
                    size="icon"
                    className="rounded-full bg-yellow-600/50"
                    title="Request sent"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  onClick={onLeave}
                  size="icon"
                  className="rounded-full bg-red-600 hover:bg-red-700"
                  title="Leave ChainCast"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Reactions (Bottom Right) */}
          <div className="absolute bottom-24 right-4">
            <div className="flex flex-col gap-2">
              {reactions.map((reaction) => (
                <Button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  size="icon"
                  className="rounded-full bg-slate-900/80 backdrop-blur-xl hover:bg-slate-800 border border-slate-700/50"
                  title={reaction.label}
                >
                  <span className="text-lg">{reaction.emoji}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-l border-slate-700/50 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-slate-700/50">
            <div className="flex">
              {[
                { id: 'participants', label: 'Participants', icon: Users },
                { id: 'chat', label: 'Chat', icon: MessageCircle },
                { id: 'reactions', label: 'Reactions', icon: Heart }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    variant="ghost"
                    className={`flex-1 rounded-none ${
                      activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'participants' && (
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {/* Admin */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={chainCast.admin.profilePicture} />
                      <AvatarFallback>{chainCast.admin.name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {chainCast.admin.name} {isAdmin && '(You)'}
                        </span>
                        <Crown className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {isAdmin ? (
                          <>
                            {isAudioEnabled ? (
                              <span className="text-green-400">🎤 Speaking</span>
                            ) : (
                              <span className="text-red-400">🎤 Muted</span>
                            )}
                            {isVideoEnabled && <span className="text-green-400">📹 Video On</span>}
                          </>
                        ) : (
                          <span className="text-green-400">🎤 Admin</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regular Participants */}
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{participant.username?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-white font-medium">{participant.username}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-blue-400">👤 Viewer</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!isAdmin && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={userInfo?.profileImage || userInfo?.profilePicture} />
                        <AvatarFallback>{userInfo?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-white font-medium">{userInfo?.name} (You)</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-blue-400">👤 Viewer</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {chatMessages.map((message, index) => (
                      <div key={`${message.id}-${index}`} className="space-y-1">
                        <div className="text-xs text-slate-400">
                          {message.username} • {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-white bg-slate-800/30 rounded p-2">
                          {message.message}
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No messages yet</p>
                        <p className="text-slate-500 text-sm">Start the conversation!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {chainCast.settings.allowChat && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-slate-800 border-slate-600"
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'reactions' && (
              <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-5 gap-2">
                  {reactions.map((reaction) => (
                    <Button
                      key={reaction.emoji}
                      onClick={() => handleReaction(reaction.emoji)}
                      variant="outline"
                      className="aspect-square border-slate-600 hover:bg-slate-800"
                      title={reaction.label}
                    >
                      <span className="text-xl">{reaction.emoji}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}