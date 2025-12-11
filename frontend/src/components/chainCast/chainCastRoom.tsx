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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Heart,
  AlertCircle
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
  onHangUp?: () => void // Optional, only for admins
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

export default function ChainCastRoom({ chainCast, onLeave, onHangUp }: ChainCastRoomProps) {
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)
  // Prioritize community admin token
  const token = useSelector((state: RootState) => state.communityAdminAuth?.token || state.userAuth?.token)

  // Determine user info and role
  const userInfo = currentUser || currentAdmin
  const isAdmin = !!currentAdmin || chainCast.userRole === 'admin'
  const userRole = isAdmin ? 'admin' : 'viewer'
  const userName = userInfo?.name || userInfo?.username || 'Unknown User'

  console.log('🎬 ChainCast Room Initialized:', {
    isAdmin,
    userRole,
    userName,
    chainCastId: chainCast._id
  })

  // State
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'reactions'>('participants')
  const [participantCount, setParticipantCount] = useState(isAdmin ? 1 : 0)
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [chainCastEnded, setChainCastEnded] = useState(false)

  // Permission state: Admins strictly start with true, others false until promoted
  const [canStream, setCanStream] = useState(isAdmin)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const messageId = useRef(0)
  const adminVideoRef = useRef<HTMLVideoElement>(null)

  // WebRTC hook for local stream
  const {
    localStream,
    participants,
    isVideoEnabled,
    isAudioEnabled,
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
  const { registerRemoteVideoRef } = useChainCastWebRTC({
    chainCastId: chainCast._id,
    isAdmin: canStream, // Use canStream to determine if we should broadcast
    localStream,
    userId: userInfo?._id || '',
    participants
  })

  // Register admin video ref for remote stream
  // We need to register refs for ANYONE who is streaming. 
  // For simplicity, we prioritize the main admin in the large view if we aren't the admin.
  const [adminStreamReady, setAdminStreamReady] = useState(false)

  useEffect(() => {
    // If we are not the admin, we want to see the admin
    // In a full grid view, we'd map all participants. 
    // Here we focus on the main admin for the large view.
    if (!isAdmin && adminVideoRef.current) {
      // Try to find the Community Admin first
      const adminParticipant = participants.find(p => p.userType === 'communityAdmin')
      const adminUserId = chainCast.admin?._id || adminParticipant?.userId

      if (adminUserId) {
        console.log('📺 Registering admin video ref for:', adminUserId)
        registerRemoteVideoRef(adminUserId, adminVideoRef.current)

        // Check if stream is ready
        const checkStream = setInterval(() => {
          if (adminVideoRef.current?.srcObject) {
            console.log('✅ Admin stream is ready!')
            setAdminStreamReady(true)
            clearInterval(checkStream)
          }
        }, 500)

        return () => clearInterval(checkStream)
      }
    }
  }, [isAdmin, registerRemoteVideoRef, participants, chainCast.admin])


  // Initialize ChainCast room with liberal approach
  useEffect(() => {
    let mounted = true

    const initializeRoom = async () => {
      if (!chainCast || !mounted) {
        setLoading(false)
        return
      }

      try {
        setConnectionError(null)

        // Liberal connection 
        await chainCastSocketService.ensureConnection(token || 'liberal-token')

        if (!mounted) return

        // Setup listeners
        setupSocketListeners()

        // Join
        chainCastSocketService.joinChainCast(chainCast._id)

        if (mounted) {
          setIsJoined(true)
          setParticipantCount(prev => isAdmin ? Math.max(prev, 1) : prev + 1)
        }

        // Initialize media immediately if we can stream
        try {
          if (canStream || isAdmin) {
            console.log('🎤 Initializing stream (Admin mode)')
            await initializeLocalStream(true, true) // Start with both on for admin
          } else {
            console.log('👤 Initializing view-only mode')
            await initializeLocalStream(false, false)
          }
        } catch (error) {
          console.warn('⚠️ Media init failed:', error)
          // Retry once
          try {
            await initializeLocalStream(true, true)
          } catch (e) { console.error('Retry failed', e) }
        }

        if (mounted) setLoading(false)

      } catch (error: any) {
        console.error('❌ Failed to initialize:', error)
        if (mounted) {
          setConnectionError(error.message)
          setLoading(false)
          setIsJoined(true)
        }
      }
    }

    initializeRoom()

    return () => {
      mounted = false
      cleanup()
      if (chainCast) {
        chainCastSocketService.leaveChainCast(chainCast._id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainCast._id, isAdmin]) // Only run once on mount essentially


  const setupSocketListeners = useCallback(() => {
    // Connection
    chainCastSocketService.onJoinedChainCast((data: any) => {
      console.log('✅ Joined:', data)
      setParticipantCount(data.participantCount || 1)
      if (data.canStream) setCanStream(true)

      if (data.participants && Array.isArray(data.participants)) {
        console.log('👥 Initial participants:', data.participants.length)
        data.participants.forEach((p: any) => {
          addParticipant({
            userId: p.userId,
            username: p.username,
            userType: p.userType || 'user',
            hasVideo: p.hasVideo || false,
            hasAudio: p.hasAudio || false,
            isMuted: p.isMuted || false,
            isVideoOff: p.isVideoOff || false
          })
        })
      }
    })

    chainCastSocketService.onParticipantJoined((p) => {
      setParticipantCount(prev => prev + 1)
      addParticipant({
        userId: p.userId,
        username: p.username,
        userType: p.userType || 'user',
        hasVideo: p.hasVideo || false,
        hasAudio: p.hasAudio || false,
        isMuted: p.isMuted || false,
        isVideoOff: p.isVideoOff || false
      })
      toast.info(`${p.username} joined`)
    })

    chainCastSocketService.onParticipantLeft((p) => {
      setParticipantCount(prev => Math.max(0, prev - 1))
      removeParticipant(p.userId)
      toast.info(`${p.username} left`)
    })

    chainCastSocketService.onParticipantStreamUpdate((p) => {
      updateParticipant(p.userId, {
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio,
        isMuted: p.isMuted,
        isVideoOff: p.isVideoOff
      })
    })

    // Chat
    chainCastSocketService.onNewMessage((msg) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg].slice(-100)
      })
    })

    // Reactions
    chainCastSocketService.onNewReaction((r) => showFloatingReaction(r.emoji, r.username))

    chainCastSocketService.onStreamUpdateError((data) => {
      toast.error(data.error)
    })

    // ChainCast ended by admin
    chainCastSocketService.onChainCastEnded(() => {
      setChainCastEnded(true)
      toast.error('ChainCast has been ended by the host')
    })

  }, [addParticipant, removeParticipant, updateParticipant, localStream, initializeLocalStream, isAdmin])


  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])




  const handleVideoToggle = useCallback(() => {
    if (!canStream) return
    try {
      const enabled = toggleVideo()
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: enabled,
        hasAudio: isAudioEnabled,
        isMuted: !isAudioEnabled,
        isVideoOff: !enabled
      })
    } catch (e) {
      toast.error('Failed to toggle video')
    }
  }, [canStream, toggleVideo, isAudioEnabled, chainCast._id])

  const handleAudioToggle = useCallback(() => {
    if (!canStream) return
    try {
      const enabled = toggleAudio()
      chainCastSocketService.updateStream({
        chainCastId: chainCast._id,
        hasVideo: isVideoEnabled,
        hasAudio: enabled,
        isMuted: !enabled,
        isVideoOff: !isVideoEnabled
      })
    } catch (e) {
      toast.error('Failed to toggle audio')
    }
  }, [canStream, toggleAudio, isVideoEnabled, chainCast._id])





  const handleReaction = useCallback((emoji: string) => {
    chainCastSocketService.addReaction(chainCast._id, emoji)
  }, [chainCast._id])


  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const msgId = `${Date.now()}-${userInfo?._id}-${++messageId.current}`
    const localMessage: ChatMessage = {
      id: msgId,
      userId: userInfo?._id || 'unknown',
      username: userName,
      message: newMessage.trim(),
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, localMessage])
    chainCastSocketService.sendMessage(chainCast._id, newMessage.trim())
    setNewMessage('')
  }, [newMessage, chainCast._id, userInfo, userName])


  const showFloatingReaction = useCallback((emoji: string, username: string) => {
    const id = Date.now().toString()
    setFloatingReactions(prev => [...prev, {
      id, emoji, username,
      x: Math.random() * (window.innerWidth - 100),
      y: window.innerHeight - 200
    }])
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)
    if (username !== userName) toast(`${username}: ${emoji}`)
  }, [userName])


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    )
  }

  // If chaincast ended, show message
  if (chainCastEnded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 p-8 max-w-md mx-auto">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-white">ChainCast Ended</h1>
            <p className="text-slate-400">The host has ended this ChainCast.</p>
            <Button
              onClick={onLeave}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              Return
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // --- UI RENDER --- //
  const showControls = canStream


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
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h1 className="text-xl font-bold text-white">{chainCast.title}</h1>
              <Badge className="bg-red-500/20 text-red-400">LIVE</Badge>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <Users className="h-4 w-4" />
              <span>{participantCount}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <TooltipProvider>
              {isAdmin && onHangUp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onHangUp} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                      <PhoneOff className="h-4 w-4 mr-2" /> Hang Up
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>End the ChainCast for everyone</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onLeave} variant="outline" size="sm" className="border-slate-600 text-slate-400">
                    <PhoneOff className="h-4 w-4 mr-2" /> Leave
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAdmin ? 'Leave without ending (you can rejoin)' : 'Leave the ChainCast'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main Video Area */}
        <div className="flex-1 relative p-4 flex flex-col">
          <Card className="bg-slate-900/50 border-slate-700/50 relative overflow-hidden flex-1">
            <CardContent className="p-0 h-full relative">
              {/* Logic for what to show: 
                      1. If I am streaming (Video On), show ME.
                      2. If I am NOT streaming, show Admin Remote.
                  */}
              {canStream && isVideoEnabled && localStream ? (
                // Admin viewing their own stream
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : !canStream ? (
                // Viewer watching admin stream - always render video element so it can receive stream
                <video
                  ref={adminVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: adminStreamReady ? 'block' : 'none' }}
                />
              ) : null}

              {/* Fallback / Avatar View - show when no video is available */}
              {(!canStream && !adminStreamReady) || (canStream && !isVideoEnabled) ? (
                <div className="absolute inset-0 h-full flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={chainCast.admin.profilePicture} />
                      <AvatarFallback className="text-4xl bg-gradient-to-r from-red-500 to-pink-600">
                        {chainCast.admin.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-medium text-white">{chainCast.admin.name}</h3>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-slate-400">
                        {canStream ? 'Camera is off' : 'Waiting for stream...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Overlay Info */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded">
                  <span className="text-white font-medium">
                    {canStream ? `${userName} (You)` : chainCast.admin.name}
                  </span>
                  {isAdmin && <Crown className="h-4 w-4 text-yellow-400" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls Bar */}
          <div className="mt-4 flex justify-center">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-full px-6 py-3 border border-slate-700/50 flex gap-4">
              <TooltipProvider>
                {showControls && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleAudioToggle}
                          size="icon"
                          className={`rounded-full ${isAudioEnabled ? 'bg-slate-700' : 'bg-red-600'}`}
                        >
                          {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleVideoToggle}
                          size="icon"
                          className={`rounded-full ${isVideoEnabled ? 'bg-slate-700' : 'bg-red-600'}`}
                        >
                          {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onLeave} size="icon" className="rounded-full bg-red-600 hover:bg-red-700">
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leave ChainCast</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Reaction Bar */}
          <div className="mt-4 flex justify-center gap-2">
            {reactions.map(r => (
              <Button
                key={r.emoji}
                variant="ghost"
                className="text-xl hover:bg-slate-800 rounded-full h-10 w-10 p-0"
                onClick={() => handleReaction(r.emoji)}
              >
                {r.emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-l border-slate-700/50 flex flex-col">
          <div className="flex border-b border-slate-700/50">
            <Button
              variant="ghost"
              className={`flex-1 rounded-none py-6 ${activeTab === 'participants' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              onClick={() => setActiveTab('participants')}
            >
              <Users className="h-4 w-4 mr-2" /> Participants
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-none py-6 ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Chat
            </Button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'participants' && (
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {/* Admin */}
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
                    <div>
                      <p className="text-white font-medium flex items-center gap-1">
                        {chainCast.admin.name} <Crown className="h-3 w-3 text-yellow-400" />
                      </p>
                      <p className="text-xs text-slate-400">Host</p>
                    </div>
                  </div>
                  {/* Others would go here... */}
                </div>
              </ScrollArea>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="bg-slate-800/50 rounded p-2">
                        <p className="text-xs text-slate-400 mb-1">{msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}</p>
                        <p className="text-white text-sm break-words">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-slate-800 border-none text-white"
                  />
                  <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}