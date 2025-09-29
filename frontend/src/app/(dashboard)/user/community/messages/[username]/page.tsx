"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Phone, 
  Video, 
  MoreHorizontal,
  Paperclip,
  Smile,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from "@/lib/utils"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

interface Message {
  id: string
  content: string
  type: 'text' | 'audio' | 'image'
  timestamp: Date
  isSent: boolean
  isRead?: boolean
  audioUrl?: string
  audioDuration?: number
  imageUrl?: string
}

interface ChatPageProps {
  params: {
    username: string
  }
}

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: '1',
    content: "Hey! How are you doing?",
    type: 'text',
    timestamp: new Date(Date.now() - 3600000),
    isSent: false,
    isRead: true
  },
  {
    id: '2',
    content: "I'm doing great! Thanks for asking. How about you?",
    type: 'text',
    timestamp: new Date(Date.now() - 3550000),
    isSent: true,
    isRead: true
  },
  {
    id: '3',
    content: "",
    type: 'audio',
    timestamp: new Date(Date.now() - 3500000),
    isSent: false,
    audioUrl: "/audio/sample.mp3",
    audioDuration: 15,
    isRead: true
  },
  {
    id: '4',
    content: "That's awesome! I'm working on some exciting projects lately.",
    type: 'text',
    timestamp: new Date(Date.now() - 3400000),
    isSent: true,
    isRead: true
  },
  {
    id: '5',
    content: "Check out this cool image I found!",
    type: 'image',
    timestamp: new Date(Date.now() - 3300000),
    isSent: false,
    imageUrl: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400",
    isRead: true
  }
]

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()
  const { username } = params
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Format audio duration
  const formatAudioDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle send message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        type: 'text',
        timestamp: new Date(),
        isSent: true,
        isRead: false
      }
      setMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Start recording
  const startRecording = () => {
    setIsRecording(true)
    setRecordingDuration(0)
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
  }

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    
    // Mock audio message
    const audioMessage: Message = {
      id: Date.now().toString(),
      content: '',
      type: 'audio',
      timestamp: new Date(),
      isSent: true,
      audioUrl: '/audio/sample.mp3',
      audioDuration: recordingDuration,
      isRead: false
    }
    setMessages(prev => [...prev, audioMessage])
    setRecordingDuration(0)
  }

  // Handle audio play/pause
  const handleAudioPlayPause = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      // Pause current audio
      const audio = audioRefs.current[messageId]
      if (audio) {
        audio.pause()
      }
      setPlayingAudio(null)
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause()
      }
      
      // Play new audio
      if (!audioRefs.current[messageId]) {
        const audio = new Audio(audioUrl)
        audioRefs.current[messageId] = audio
        
        audio.addEventListener('timeupdate', () => {
          const progress = (audio.currentTime / audio.duration) * 100
          setAudioProgress(prev => ({ ...prev, [messageId]: progress }))
        })
        
        audio.addEventListener('ended', () => {
          setPlayingAudio(null)
          setAudioProgress(prev => ({ ...prev, [messageId]: 0 }))
        })
      }
      
      audioRefs.current[messageId].play()
      setPlayingAudio(messageId)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push(`/user/community/${username}`)
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen flex flex-col">
        {/* Chat Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Avatar className="w-10 h-10">
                <AvatarImage src="" alt={username} />
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                  {username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-white">{username}</h3>
                <p className="text-sm text-slate-400">Online</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isSent ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl relative",
                    message.isSent
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : "bg-slate-800 text-white"
                  )}
                >
                  {message.type === 'text' && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}

                  {message.type === 'audio' && (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                        onClick={() => handleAudioPlayPause(message.id, message.audioUrl!)}
                      >
                        {playingAudio === message.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300 ease-out"
                            style={{ width: `${audioProgress[message.id] || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <span className="text-xs opacity-80">
                        {formatAudioDuration(message.audioDuration || 0)}
                      </span>
                    </div>
                  )}

                  {message.type === 'image' && (
                    <div className="space-y-2">
                      <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto"
                      />
                      {message.content && (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.isSent && (
                      <div className="flex">
                        <div className={cn(
                          "w-1 h-1 rounded-full mr-1",
                          message.isRead ? "bg-cyan-300" : "bg-slate-400"
                        )} />
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          message.isRead ? "bg-cyan-300" : "bg-slate-400"
                        )} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input Area */}
        <div className="border-t border-slate-700/50 p-4 bg-slate-900/50">
          <div className="max-w-4xl mx-auto">
            {isRecording ? (
              // Recording UI
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-medium">
                  Recording... {formatAudioDuration(recordingDuration)}
                </span>
                <div className="flex-1" />
                <Button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            ) : (
              // Normal input UI
              <div className="flex items-end gap-3">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 pr-12 resize-none"
                    maxLength={1000}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={startRecording}
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}