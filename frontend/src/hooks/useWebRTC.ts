import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface UseWebRTCOptions {
  onParticipantJoined?: (participant: { userId: string }) => void
  onParticipantLeft?: (userId: string) => void
  maxParticipants?: number
}

interface Participant {
  userId: string
  username: string
  userType: 'user' | 'communityAdmin'
  hasVideo: boolean
  hasAudio: boolean
  isMuted: boolean
  isVideoOff: boolean
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)

  // Initialize local media stream
  const initializeLocalStream = useCallback(async (video = false, audio = true) => {
    try {
      setIsConnecting(true)
      
      console.log('Initializing media stream:', { video, audio })
      
      if (!video && !audio) {
        // No media needed, just set connected
        setIsConnected(true)
        setIsConnecting(false)
        return null
      }

      const constraints: MediaStreamConstraints = {
        video: video ? {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('Media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      })

      // Stop existing stream if any
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }

      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Set initial states based on actual tracks
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      
      setIsVideoEnabled(video && videoTracks.length > 0)
      setIsAudioEnabled(audio && audioTracks.length > 0)
      setIsConnected(true)

      console.log('Media stream initialized successfully')
      return stream

    } catch (error: any) {
      console.error('Failed to get user media:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access denied. Please enable permissions.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.')
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/microphone is being used by another application.')
      } else {
        toast.error('Failed to access camera/microphone')
      }
      
      setIsConnected(false)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) {
      console.log('No local stream available')
      return false
    }

    const videoTracks = localStream.getVideoTracks()
    if (videoTracks.length > 0) {
      const newEnabled = !videoTracks[0].enabled
      videoTracks.forEach(track => {
        track.enabled = newEnabled
      })
      setIsVideoEnabled(newEnabled)
      console.log('Video toggled:', newEnabled)
      return newEnabled
    }
    
    return false
  }, [localStream])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStream) {
      console.log('No local stream available')
      return false
    }

    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length > 0) {
      const newEnabled = !audioTracks[0].enabled
      audioTracks.forEach(track => {
        track.enabled = newEnabled
      })
      setIsAudioEnabled(newEnabled)
      console.log('Audio toggled:', newEnabled)
      return newEnabled
    }
    
    return false
  }, [localStream])

  // Add participant
  const addParticipant = useCallback((participant: Participant) => {
    console.log('Adding participant:', participant.userId)
    
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === participant.userId)
      if (exists) {
        return prev.map(p => p.userId === participant.userId ? { ...p, ...participant } : p)
      }
      return [...prev, participant]
    })

    if (options.onParticipantJoined) {
      options.onParticipantJoined({ userId: participant.userId })
    }
  }, [options])

  // Remove participant
  const removeParticipant = useCallback((userId: string) => {
    console.log('Removing participant:', userId)
    
    setParticipants(prev => prev.filter(p => p.userId !== userId))

    if (options.onParticipantLeft) {
      options.onParticipantLeft(userId)
    }
  }, [options])

  // Update participant
  const updateParticipant = useCallback((userId: string, updates: Partial<Participant>) => {
    console.log('Updating participant:', userId, updates)
    
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, ...updates } : p
    ))
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC resources')
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      setLocalStream(null)
    }

    // Clear participants
    setParticipants([])
    setIsConnected(false)
    setIsVideoEnabled(false)
    setIsAudioEnabled(false)
  }, [localStream])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    // State
    localStream,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    isConnecting,
    isConnected,
    localVideoRef,

    // Actions
    initializeLocalStream,
    toggleVideo,
    toggleAudio,
    addParticipant,
    removeParticipant,
    updateParticipant,
    cleanup
  }
}