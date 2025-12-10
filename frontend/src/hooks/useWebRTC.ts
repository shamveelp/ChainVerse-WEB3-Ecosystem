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
  const streamRef = useRef<MediaStream | null>(null)

  // Liberal media stream initialization
  const initializeLocalStream = useCallback(async (video = false, audio = true) => {
    try {
      setIsConnecting(true)
      console.log('🎥 Initializing media stream:', { video, audio })

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log('🛑 Stopped existing track:', track.kind)
        })
      }

      if (!video && !audio) {
        console.log('📱 No media requested, setting connected state')
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
          autoGainControl: true,
          sampleRate: 44100
        } : false
      }

      console.log('🎬 Requesting user media with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log('✅ Media stream obtained:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      })

      // Store stream reference
      streamRef.current = stream
      setLocalStream(stream)

      // Set video element source
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        try {
          await localVideoRef.current.play()
        } catch (e) {
          console.error('Auto-play failed:', e)
        }
        console.log('📺 Video element source set and playing')
      }

      // Set initial states based on actual tracks
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()

      const videoEnabled = video && videoTracks.length > 0 && videoTracks[0].enabled
      const audioEnabled = audio && audioTracks.length > 0 && audioTracks[0].enabled

      setIsVideoEnabled(videoEnabled)
      setIsAudioEnabled(audioEnabled)
      setIsConnected(true)

      console.log('🎯 Media state initialized:', {
        videoEnabled,
        audioEnabled,
        videoTrackEnabled: videoTracks[0]?.enabled,
        audioTrackEnabled: audioTracks[0]?.enabled
      })

      return stream

    } catch (error: any) {
      console.error('❌ Failed to get user media:', error)

      let errorMessage = 'Failed to access camera/microphone'
      let showToast = true

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Camera/Microphone access denied. Please enable permissions and refresh.'
          break
        case 'NotFoundError':
          errorMessage = 'No camera or microphone found.'
          break
        case 'NotReadableError':
          errorMessage = 'Camera/microphone is being used by another application.'
          break
        case 'OverconstrainedError':
          errorMessage = 'Camera/microphone constraints not supported.'
          break
        case 'AbortError':
          showToast = false // Don't show toast for abort errors
          break
      }

      if (showToast) {
        toast.error(errorMessage)
      }

      // Liberal fallback - still set connected for audio-only or view-only mode
      if (error.name === 'NotAllowedError' && !video) {
        console.log('🔊 Falling back to view-only mode')
        setIsConnected(true)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
        return null
      }

      setIsConnected(false)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Sync stream to video element whenever they change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('🔄 Syncing stream to video element via effect')
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(e => console.error('Play error:', e))
    }
  }, [localStream])

  // Liberal toggle video
  const toggleVideo = useCallback(() => {
    if (!streamRef.current) {
      console.log('❌ No stream available for video toggle')
      toast.warning('No video stream available')
      return false
    }

    const videoTracks = streamRef.current.getVideoTracks()
    if (videoTracks.length === 0) {
      console.log('❌ No video tracks available')
      toast.warning('No video tracks available')
      return false
    }

    const newEnabled = !videoTracks[0].enabled
    videoTracks.forEach(track => {
      track.enabled = newEnabled
    })

    setIsVideoEnabled(newEnabled)
    console.log('🎥 Video toggled:', {
      enabled: newEnabled,
      trackEnabled: videoTracks[0].enabled,
      trackCount: videoTracks.length
    })

    return newEnabled
  }, [])

  // Liberal toggle audio
  const toggleAudio = useCallback(() => {
    if (!streamRef.current) {
      console.log('❌ No stream available for audio toggle')
      toast.warning('No audio stream available')
      return false
    }

    const audioTracks = streamRef.current.getAudioTracks()
    if (audioTracks.length === 0) {
      console.log('❌ No audio tracks available')
      toast.warning('No audio tracks available')
      return false
    }

    const newEnabled = !audioTracks[0].enabled
    audioTracks.forEach(track => {
      track.enabled = newEnabled
    })

    setIsAudioEnabled(newEnabled)
    console.log('🎤 Audio toggled:', {
      enabled: newEnabled,
      trackEnabled: audioTracks[0].enabled,
      trackCount: audioTracks.length
    })

    return newEnabled
  }, [])

  // Add participant with liberal checking
  const addParticipant = useCallback((participant: Participant) => {
    console.log('👤 Adding participant:', participant)

    setParticipants(prev => {
      const exists = prev.find(p => p.userId === participant.userId)
      if (exists) {
        console.log('👤 Updating existing participant:', participant.userId)
        return prev.map(p => p.userId === participant.userId ? { ...p, ...participant } : p)
      }
      console.log('👤 Adding new participant:', participant.userId)
      const newList = [...prev, participant]
      console.log('👥 Total participants:', newList.length)
      return newList
    })

    if (options.onParticipantJoined) {
      options.onParticipantJoined({ userId: participant.userId })
    }
  }, [options])

  // Remove participant
  const removeParticipant = useCallback((userId: string) => {
    console.log('👤 Removing participant:', userId)

    setParticipants(prev => {
      const newList = prev.filter(p => p.userId !== userId)
      console.log('👥 Participants after removal:', newList.length)
      return newList
    })

    if (options.onParticipantLeft) {
      options.onParticipantLeft(userId)
    }
  }, [options])

  // Update participant
  const updateParticipant = useCallback((userId: string, updates: Partial<Participant>) => {
    console.log('👤 Updating participant:', userId, updates)

    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, ...updates } : p
    ))
  }, [])

  // Liberal cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC resources')

    // Stop local stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('🛑 Stopped track:', track.kind)
      })
      streamRef.current = null
    }

    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    // Reset state
    setLocalStream(null)
    setParticipants([])
    setIsConnected(false)
    setIsVideoEnabled(false)
    setIsAudioEnabled(false)
    setIsConnecting(false)

    console.log('✅ WebRTC cleanup completed')
  }, [])

  // Auto cleanup on unmount
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