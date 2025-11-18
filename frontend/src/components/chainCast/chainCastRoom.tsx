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
import { useChainCastWebRTC } from '@/hooks/useChainCastWebRTC'
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
  const userName = userInfo?.name || userInfo?.username || 'Unknown User'

  console.log('🎬 ChainCast Room Initialized:', {
    isAdmin,
    userRole,
    userName,
    chainCastId: chainCast._id,
    chainCastTitle: chainCast.title
  })

  // State
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showModeratorRequest, setShowModeratorRequest] = useState(false)
  const [requestingSent, setRequestingSent] = useState(false)
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'reactions'>('participants')
  const [participantCount, setParticipantCount] = useState(isAdmin ? 1 : 0)
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const messageId = useRef(0)
  const adminVideoRef = useRef<HTMLVideoElement>(null)

  // WebRTC hook for local stream
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
      console.log('👤 Participant joined via WebRTC:', participant)
    },
    onParticipantLeft: (userId) => {
      console.log('👤 Participant left via WebRTC:', userId)
    }
  })

  // WebRTC hook for peer connections (sharing streams)
  const { remoteStreams, registerRemoteVideoRef } = useChainCastWebRTC({
    chainCastId: chainCast._id,
    isAdmin,
    localStream,
    userId: userInfo?._id || ''
  })

  // Register admin video ref for remote stream
  useEffect(() => {
    if (!isAdmin && adminVideoRef.current) {
      // Find admin user ID from participants or chainCast
      const adminUserId = chainCast.admin?._id || participants.find(p => p.userType === 'communityAdmin')?.userId
      if (adminUserId) {
        registerRemoteVideoRef(adminUserId, adminVideoRef.current)
      }
    }
  }, [isAdmin, registerRemoteVideoRef, participants, chainCast.admin])

  // Initialize ChainCast room with liberal approach
  useEffect(() => {
    let mounted = true
    let initTimeout: NodeJS.Timeout

    const initializeRoom = async () => {
      if (!chainCast || !mounted) {
        setLoading(false)
        return
      }

      try {
        console.log('🚀 Initializing ChainCast room...', {
          chainCastId: chainCast._id,
          userRole,
          isAdmin,
          userName
        })

        setConnectionError(null)
        
        // Liberal connection - don't wait for token validation
        await chainCastSocketService.ensureConnection(token || 'liberal-token')
        
        if (!mounted) return

        // Setup socket listeners before joining
        setupSocketListeners()

        // Join ChainCast room with retry
        try {
          await chainCastSocketService.joinChainCast(chainCast._id)
        } catch (error) {
          console.warn('⚠️ Initial join failed, retrying...', error)
          setTimeout(() => {
            if (mounted) {
              chainCastSocketService.joinChainCast(chainCast._id)
            }
          }, 1000)
        }

        if (mounted) {
          setIsJoined(true)
          setParticipantCount(prev => isAdmin ? Math.max(prev, 1) : prev + 1)
        }

        // Initialize media based on role with liberal timeout
        initTimeout = setTimeout(async () => {
          if (!mounted) return
          
          try {
            if (isAdmin) {
              console.log('👑 Admin: Initializing with video and audio')
              await initializeLocalStream(true, true)
            } else {
              console.log('👤 Viewer: Initializing view-only mode')
              await initializeLocalStream(false, false)
            }
          } catch (error) {
            console.warn('⚠️ Media initialization failed:', error)
            // Continue anyway for liberal approach
          }
          
          if (mounted) {
            setLoading(false)
          }
        }, isAdmin ? 1000 : 500) // Faster initialization for viewers

      } catch (error: any) {
        console.error('❌ Failed to initialize ChainCast room:', error)
        if (mounted) {
          setConnectionError(error.message || 'Connection failed')
          setLoading(false)
          // Still try to continue for liberal approach
          setIsJoined(true)
        }
      }
    }

    initializeRoom()

    return () => {
      mounted = false
      if (initTimeout) clearTimeout(initTimeout)
      cleanup()
      if (isJoined && chainCast) {
        chainCastSocketService.leaveChainCast(chainCast._id)
      }
    }
  }, [chainCast._id, isAdmin])

  // Setup socket event listeners with liberal handling
  const setupSocketListeners = useCallback(() => {
    console.log('🔗 Setting up socket listeners')

    // Connection events
    chainCastSocketService.onJoinedChainCast((data) => {
      console.log('✅ Joined ChainCast successfully:', data)
      setParticipantCount(data.participantCount || 1)
      toast.success('Joined ChainCast successfully')
    })

    chainCastSocketService.onLeftChainCast((data) => {
      console.log('🚪 Left ChainCast:', data)
      setParticipantCount(data.participantCount || 0)
    })

    // Participant events
    chainCastSocketService.onParticipantJoined((participant) => {
      console.log('👤 New participant joined:', participant)
      setParticipantCount(prev => prev + 1)
      
      addParticipant({
        userId: participant.userId,
        username: participant.username,
        userType: participant.userType || 'user',
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || true
      })
      
      toast.success(`${participant.username} joined the ChainCast`)
    })

    chainCastSocketService.onParticipantLeft((participant) => {
      console.log('👤 Participant left:', participant)
      setParticipantCount(prev => Math.max(0, prev - 1))
      removeParticipant(participant.userId)
      toast.info(`${participant.username} left the ChainCast`)
    })

    chainCastSocketService.onParticipantStreamUpdate((participant) => {
      console.log('📹 Participant stream updated:', participant)
      updateParticipant(participant.userId, {
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || false
      })
    })

    // Chat messages - only receive messages from other users (not our own)
    chainCastSocketService.onNewMessage((message: ChatMessage) => {
      console.log('💬 New chat message from other user:', message)
      setChatMessages(prev => {
        // Prevent duplicates by checking message ID
        const isDuplicate = prev.some(m => m.id === message.id)
        
        if (isDuplicate) {
          console.log('💬 Duplicate message detected, ignoring')
          return prev
        }
        
        const newMessages = [...prev, message].slice(-100) // Keep last 100 messages
        return newMessages
      })
    })

    // Message sent confirmation - update local message with server ID
    chainCastSocketService.onMessageSent((message: ChatMessage) => {
      console.log('✅ Message sent confirmation:', message)
      setChatMessages(prev => {
        // Find and replace the local message with the server-confirmed one
        const messageIndex = prev.findIndex(m => 
          m.userId === message.userId && 
          m.message === message.message &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000
        )
        
        if (messageIndex !== -1) {
          // Replace local message with server-confirmed message
          const updated = [...prev]
          updated[messageIndex] = message
          return updated
        }
        
        // If not found, add it (shouldn't happen, but just in case)
        return [...prev, message].slice(-100)
      })
    })

    // Reactions
    chainCastSocketService.onNewReaction((reaction) => {
      console.log('😀 New reaction:', reaction)
      showFloatingReaction(reaction.emoji, reaction.username)
    })

    // Moderation events
    chainCastSocketService.onModerationRequested((data) => {
      console.log('🛡️ Moderation requested:', data)
      toast.success('Moderation request sent to admin')
      setShowModeratorRequest(false)
      setRequestingSent(true)
    })

    chainCastSocketService.onModerationReviewed((data) => {
      console.log('🛡️ Moderation reviewed:', data)
      if (data.status === 'approved') {
        toast.success(`Moderation approved by ${data.adminName}`)
      } else {
        toast.error(`Moderation rejected by ${data.adminName}`)
      }
      setRequestingSent(false)
    })

    // ChainCast control events
    chainCastSocketService.onChainCastStarted((data) => {
      console.log('🎬 ChainCast started:', data)
      toast.info(`ChainCast started by ${data.adminName}`)
    })

    chainCastSocketService.onChainCastEnded((data) => {
      console.log('🎬 ChainCast ended:', data)
      toast.info('ChainCast has ended')
      setTimeout(onLeave, 2000)
    })

    chainCastSocketService.onRemovedFromChainCast((data) => {
      console.log('🚫 Removed from ChainCast:', data)
      toast.error(`Removed from ChainCast by ${data.adminName}`)
      setTimeout(onLeave, 1000)
    })

    // Error handlers
    chainCastSocketService.onError((data) => {
      console.error('❌ Socket error:', data)
      toast.error(data.message)
    })

    chainCastSocketService.onJoinError((data) => {
      console.error('❌ Join error:', data)
      toast.error('Failed to join ChainCast: ' + data.error)
    })

    // Stream update error handler
    chainCastSocketService.onStreamUpdateError((data) => {
      console.error('❌ Stream update error:', data)
      toast.error(data.error || 'Only community admin can control streaming')
    })
  }, [addParticipant, removeParticipant, updateParticipant, onLeave])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollElement = chatScrollRef.current
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }, [chatMessages])

  // Handle video toggle with liberal error handling
  const handleVideoToggle = useCallback(() => {
    if (!isAdmin) {
      toast.error('Only admin can control video')
      return
    }

    try {
      const enabled = toggleVideo()
      
      // Broadcast stream update
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: enabled,
        hasAudio: isAudioEnabled,
        isMuted: !isAudioEnabled,
        isVideoOff: !enabled
      })
      
      toast.success(`Video ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('❌ Video toggle failed:', error)
      toast.error('Failed to toggle video')
    }
  }, [toggleVideo, isAudioEnabled, chainCast._id, isAdmin])

  // Handle audio toggle with liberal error handling
  const handleAudioToggle = useCallback(() => {
    if (!isAdmin) {
      toast.error('Only admin can control audio')
      return
    }

    try {
      const enabled = toggleAudio()
      
      // Broadcast stream update
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: isVideoEnabled,
        hasAudio: enabled,
        isMuted: !enabled,
        isVideoOff: !isVideoEnabled
      })
      
      toast.success(`Audio ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('❌ Audio toggle failed:', error)
      toast.error('Failed to toggle audio')
    }
  }, [toggleAudio, isVideoEnabled, chainCast._id, isAdmin])

  // Handle reaction with liberal approach
  const handleReaction = useCallback(async (emoji: string) => {
    try {
      chainCastSocketService.addReaction(chainCast._id, emoji)
      console.log('😀 Reaction sent:', emoji)
    } catch (error: any) {
      console.error('❌ Failed to send reaction:', error)
      // Don't show error toast for reactions - liberal approach
    }
  }, [chainCast._id])

  // Handle moderation request
  const handleModerationRequest = useCallback(async () => {
    try {
      setRequestingSent(true)
      chainCastSocketService.requestModeration({
        chainCastId: chainCast._id,
        requestedPermissions: { video: false, audio: true },
        message: 'Requesting to speak'
      })
      setShowModeratorRequest(false)
    } catch (error: any) {
      console.error('❌ Failed to send moderation request:', error)
      toast.error('Failed to send moderation request')
      setRequestingSent(false)
    }
  }, [chainCast._id])

  // Send chat message with liberal handling
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      // Generate unique message ID
      const msgId = `${Date.now()}-${userInfo?._id}-${++messageId.current}`
      
      // Add message locally first for immediate feedback
      const localMessage: ChatMessage = {
        id: msgId,
        userId: userInfo?._id || 'unknown',
        username: userName,
        message: newMessage.trim(),
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, localMessage])
      
      // Send through socket
      chainCastSocketService.sendMessage(chainCast._id, newMessage.trim())
      setNewMessage('')
      
      console.log('💬 Message sent:', localMessage)
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }, [newMessage, chainCast._id, userInfo, userName])

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

    // Show toast notification
    if (username !== userName) {
      toast.success(`${username} reacted with ${emoji}`, { duration: 2000 })
    }
  }, [userName])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
          <p className="text-white text-lg">Joining ChainCast...</p>
          {connectionError && (
            <p className="text-yellow-400 text-sm">Connection issues detected, but continuing...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-4xl animate-bounce"
            style={{ 
              left: reaction.x, 
              top: reaction.y,
              animation: 'float-up 3s ease-out forwards'
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4 flex-shrink-0">
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
            {connectionError && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                Connection Issues
              </Badge>
            )}
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

      <div className="flex-1 flex min-h-0">
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
                ) : !isAdmin && adminVideoRef.current?.srcObject ? (
                  <video
                    ref={adminVideoRef}
                    autoPlay
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
                      <p className="text-slate-400">
                        {isAdmin ? 'Community Admin' : 'Waiting for stream...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stream Status Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-lg font-medium bg-black/50 px-3 py-1 rounded">
                      {isAdmin ? `${userName} (You)` : chainCast.admin.name}
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
        <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-l border-slate-700/50 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="border-b border-slate-700/50 flex-shrink-0">
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
          <div className="flex-1 overflow-hidden min-h-0">
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
                          <span className="text-green-400">👑 Admin</span>
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

                  {/* Current User (if not admin) */}
                  {!isAdmin && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={userInfo?.profileImage || userInfo?.profilePicture} />
                        <AvatarFallback>{userName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-white font-medium">{userName} (You)</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-blue-400">👤 Viewer</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {participants.length === 0 && !isAdmin && (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>You're the first viewer!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4 min-h-0" ref={chatScrollRef}>
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
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-slate-800 border-slate-600"
                        maxLength={500}
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
                <div className="mt-4 text-center text-slate-400 text-sm">
                  Click to react during the stream
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Custom styles for floating reactions */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}