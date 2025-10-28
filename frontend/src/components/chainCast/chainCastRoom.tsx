"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Phone,
  Settings,
  Crown,
  Shield,
  Heart,
  Loader2,
  Send,
  PhoneOff,
  Hand,
  MoreVertical,
  Camera,
  CameraOff
} from 'lucide-react'
import { RootState } from '@/redux/store'
import { useWebRTC } from '@/hooks/useWebRTC'
import { chainCastSocketService, type ChainCastParticipant as SocketParticipant } from '@/services/socket/chainCastSocketService'
import { toast } from 'sonner'
import {
  type ChainCast,
  userChainCastApiService,
  type AddReactionRequest,
  type RequestModerationRequest
} from '@/services/chainCast/userChainCastApiService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

interface ParticipantData {
  userId: string
  username: string
  userType: 'user' | 'communityAdmin'
  hasVideo: boolean
  hasAudio: boolean
  isMuted: boolean
  isVideoOff: boolean
}

const reactions = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '👎', label: 'Dislike' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💯', label: '100' }
]

export default function ChainCastRoom({ chainCast, onLeave }: ChainCastRoomProps) {
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)
  const token = useSelector((state: RootState) => state.userAuth?.token || state.communityAdminAuth?.token)

  // Determine user info
  const userInfo = currentUser || currentAdmin
  const isAdmin = chainCast.userRole === 'admin'
  const isModerator = chainCast.canModerate
  const isViewer = !isAdmin && !isModerator

  console.log('ChainCast Room Debug:', {
    userRole: chainCast.userRole,
    canModerate: chainCast.canModerate,
    isAdmin,
    isModerator,
    isViewer,
    userInfo: userInfo?.name
  })

  // State
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showModeratorRequest, setShowModeratorRequest] = useState(false)
  const [requestingSent, setRequestingSent] = useState(false)
  const [moderationRequest, setModerationRequest] = useState({
    video: false,
    audio: false,
    message: ''
  })
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'reactions'>('participants')

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
    maxParticipants: 5,
    onParticipantJoined: (participant) => {
      toast.success(`${participant.userId} joined the ChainCast`)
    },
    onParticipantLeft: (userId) => {
      toast.info(`User left the ChainCast`)
    }
  })

  // Initialize ChainCast room
  useEffect(() => {
    const initializeRoom = async () => {
      if (!token || !chainCast) {
        setLoading(false)
        return
      }

      try {
        console.log('Initializing ChainCast room...', {
          chainCastId: chainCast._id,
          userRole: chainCast.userRole,
          isAdmin,
          isModerator
        })

        // Connect to socket if not connected
        if (!chainCastSocketService.isConnected()) {
          await chainCastSocketService.connect(token)
        }

        // Join ChainCast room
        await chainCastSocketService.joinChainCast(chainCast._id)
        setIsJoined(true)

        // Initialize media stream based on role
        if (isAdmin) {
          console.log('Admin: Initializing with full video and audio')
          await initializeLocalStream(true, true)
        } else if (isModerator) {
          console.log('Moderator: Initializing with video and audio')
          await initializeLocalStream(true, true)
        } else {
          console.log('Viewer: Initializing with audio only')
          await initializeLocalStream(false, true)
        }

        setupSocketListeners()

      } catch (error: any) {
        console.error('Failed to initialize ChainCast room:', error)
        toast.error('Failed to join ChainCast', {
          description: error.message || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    initializeRoom()

    return () => {
      cleanup()
      if (isJoined) {
        chainCastSocketService.leaveChainCast(chainCast._id)
      }
    }
  }, [chainCast, token, initializeLocalStream, cleanup, isJoined, isAdmin, isModerator])

  // Setup socket event listeners
  const setupSocketListeners = useCallback(() => {
    // Participant events
    chainCastSocketService.onParticipantJoined((participant: SocketParticipant) => {
      addParticipant({
        userId: participant.userId,
        username: participant.username,
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || false
      })
    })

    chainCastSocketService.onParticipantLeft((participant: SocketParticipant) => {
      removeParticipant(participant.userId)
    })

    chainCastSocketService.onParticipantStreamUpdate((participant: SocketParticipant) => {
      updateParticipant(participant.userId, {
        hasVideo: participant.hasVideo || false,
        hasAudio: participant.hasAudio || false,
        isMuted: participant.isMuted || false,
        isVideoOff: participant.isVideoOff || false
      })
    })

    // Chat messages (if implemented)
    chainCastSocketService.socket?.on('new_message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message])
    })

    // Reaction events
    chainCastSocketService.onNewReaction((reaction) => {
      // Show floating reaction animation
      showFloatingReaction(reaction.emoji, reaction.username)
    })

    // Moderation events
    chainCastSocketService.onModerationRequested((data) => {
      toast.success(data.message)
      setShowModeratorRequest(false)
      setRequestingSent(true)
    })

    chainCastSocketService.onModerationReviewed((data) => {
      if (data.status === 'approved') {
        toast.success(`Moderation approved by ${data.adminName}`)
        // Re-initialize stream with video if approved
        if (moderationRequest.video) {
          initializeLocalStream(true, true)
        }
      } else {
        toast.error(`Moderation rejected: ${data.adminName}`)
      }
    })

    // ChainCast control events
    chainCastSocketService.onChainCastEnded(() => {
      toast.info('ChainCast has ended')
      setTimeout(onLeave, 2000) // Auto-leave after 2 seconds
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
  }, [addParticipant, removeParticipant, updateParticipant, moderationRequest, initializeLocalStream, onLeave])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Handle video toggle
  const handleVideoToggle = useCallback(() => {
    if (!isAdmin && !isModerator) {
      toast.error('You need permission to enable video. Request moderator access first.')
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
  }, [toggleVideo, isAudioEnabled, chainCast._id, isAdmin, isModerator])

  // Handle audio toggle
  const handleAudioToggle = useCallback(() => {
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
  }, [toggleAudio, isVideoEnabled, chainCast._id])

  // Handle reaction
  const handleReaction = useCallback(async (emoji: string) => {
    try {
      await userChainCastApiService.addReaction({
        chainCastId: chainCast._id,
        emoji
      })
      // The socket will handle broadcasting the reaction
    } catch (error: any) {
      toast.error('Failed to send reaction', {
        description: error.message
      })
    }
  }, [chainCast._id])

  // Handle moderation request
  const handleModerationRequest = useCallback(async () => {
    if (!moderationRequest.video && !moderationRequest.audio) {
      toast.error('Please select at least one permission to request')
      return
    }

    try {
      setRequestingSent(true)
      
      const requestData: RequestModerationRequest = {
        chainCastId: chainCast._id,
        requestedPermissions: {
          video: moderationRequest.video,
          audio: moderationRequest.audio
        },
        message: moderationRequest.message
      }

      await userChainCastApiService.requestModeration(requestData)
      toast.success('Moderation request sent to admin')
      setShowModeratorRequest(false)
    } catch (error: any) {
      toast.error('Failed to send moderation request', {
        description: error.message
      })
      setRequestingSent(false)
    }
  }, [chainCast._id, moderationRequest])

  // Handle leave
  const handleLeave = useCallback(async () => {
    try {
      if (!isAdmin) {
        await userChainCastApiService.leaveChainCast(chainCast._id)
      }
      onLeave()
    } catch (error: any) {
      console.error('Failed to leave ChainCast:', error)
      onLeave() // Leave anyway
    }
  }, [chainCast._id, onLeave, isAdmin])

  // Send chat message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: userInfo?._id || '',
      username: userInfo?.username || userInfo?.name || 'Unknown',
      message: newMessage.trim(),
      timestamp: new Date()
    }

    // Send through socket for real-time chat
    if (chainCastSocketService.isConnected()) {
      chainCastSocketService.socket?.emit('send_message', {
        chainCastId: chainCast._id,
        message: message.message
      })
    }

    setChatMessages(prev => [...prev, message])
    setNewMessage('')
  }, [newMessage, userInfo, chainCast._id])

  // Show floating reaction
  const showFloatingReaction = useCallback((emoji: string, username: string) => {
    // Create floating reaction element
    const reactionEl = document.createElement('div')
    reactionEl.className = 'fixed text-4xl pointer-events-none z-50 animate-bounce'
    reactionEl.textContent = emoji
    reactionEl.style.left = Math.random() * (window.innerWidth - 100) + 'px'
    reactionEl.style.top = window.innerHeight - 200 + 'px'

    document.body.appendChild(reactionEl)

    // Remove after animation
    setTimeout(() => {
      if (document.body.contains(reactionEl)) {
        document.body.removeChild(reactionEl)
      }
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
              <span>{participants.length + 1}/{chainCast.maxParticipants}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleLeave}
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
          {/* Video Grid */}
          <div className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local Video */}
              <Card className="bg-slate-900/50 border-slate-700/50 relative overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={userInfo?.profilePic || userInfo?.profilePicture} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl">
                          {userInfo?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {/* User Info Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        {userInfo?.name || 'You'} (You)
                      </span>
                      {isAdmin && <Crown className="h-4 w-4 text-yellow-400" />}
                      {isModerator && <Shield className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isAudioEnabled && <MicOff className="h-4 w-4 text-red-400" />}
                      {!isVideoEnabled && <VideoOff className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remote Participants */}
              {participants.map((participant) => (
                <Card key={participant.userId} className="bg-slate-900/50 border-slate-700/50 relative overflow-hidden">
                  <CardContent className="p-0 h-full relative">
                    {participant.stream ? (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(video) => {
                          if (video && participant.stream) {
                            video.srcObject = participant.stream
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full bg-slate-800 flex items-center justify-center">
                        <Avatar className="w-20 h-20">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xl">
                            {participant.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Participant Info */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        {participant.username}
                      </span>
                      <div className="flex items-center gap-1">
                        {participant.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                        {participant.isVideoOff && <VideoOff className="h-4 w-4 text-red-400" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl rounded-full px-6 py-3 border border-slate-700/50">
              {/* Audio control - always available */}
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

              {/* Video control - only for admins and moderators */}
              {(isAdmin || isModerator) && (
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
              )}

              {/* Request moderation button - only for viewers */}
              {isViewer && !requestingSent && (
                <Button
                  onClick={() => setShowModeratorRequest(true)}
                  size="icon"
                  className="rounded-full bg-blue-600 hover:bg-blue-700"
                  title="Request video permissions"
                >
                  <Hand className="h-4 w-4" />
                </Button>
              )}

              {/* Request sent indicator */}
              {requestingSent && (
                <Button
                  disabled
                  size="icon"
                  className="rounded-full bg-yellow-600/50"
                  title="Moderation request sent"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}

              <Button
                onClick={handleLeave}
                size="icon"
                className="rounded-full bg-red-600 hover:bg-red-700"
                title="Leave ChainCast"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reactions */}
          <div className="absolute bottom-20 right-4">
            <div className="flex flex-col gap-2">
              {reactions.slice(0, 5).map((reaction) => (
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
                  {/* Local User */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={userInfo?.profilePic || userInfo?.profilePicture} />
                      <AvatarFallback>{userInfo?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{userInfo?.name} (You)</span>
                        {isAdmin && <Crown className="h-4 w-4 text-yellow-400" />}
                        {isModerator && <Shield className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {isAudioEnabled ? (
                          <span className="text-green-400">🎤 Speaking</span>
                        ) : (
                          <span className="text-red-400">🎤 Muted</span>
                        )}
                        {isVideoEnabled && <span className="text-green-400">📹 Video On</span>}
                      </div>
                    </div>
                  </div>

                  {/* Remote Participants */}
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{participant.username?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-white font-medium">{participant.username}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {participant.hasAudio ? (
                            <span className="text-green-400">🎤 Speaking</span>
                          ) : (
                            <span className="text-red-400">🎤 Muted</span>
                          )}
                          {participant.hasVideo && <span className="text-green-400">📹 Video On</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="space-y-1">
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

      {/* Moderation Request Dialog */}
      <Dialog open={showModeratorRequest} onOpenChange={setShowModeratorRequest}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Request Video Permissions</DialogTitle>
            <DialogDescription className="text-slate-400">
              Request permission from the admin to enable your camera and become a moderator in this ChainCast.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="video" className="text-white">Enable Video Camera</Label>
                <Switch
                  id="video"
                  checked={moderationRequest.video}
                  onCheckedChange={(checked) => setModerationRequest(prev => ({ ...prev, video: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="audio" className="text-white">Enhanced Audio Permissions</Label>
                <Switch
                  id="audio"
                  checked={moderationRequest.audio}
                  onCheckedChange={(checked) => setModerationRequest(prev => ({ ...prev, audio: checked }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-white">Message to Admin (Optional)</Label>
              <Textarea
                id="message"
                value={moderationRequest.message}
                onChange={(e) => setModerationRequest(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Why do you want to become a moderator? What can you contribute?"
                className="bg-slate-800 border-slate-600 text-white mt-2"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowModeratorRequest(false)}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerationRequest}
              disabled={!moderationRequest.video && !moderationRequest.audio}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}