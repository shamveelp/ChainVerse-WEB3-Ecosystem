import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface UseWebRTCOptions {
  onParticipantJoined?: (participant: { userId: string; stream: MediaStream }) => void
  onParticipantLeft?: (userId: string) => void
  maxParticipants?: number
}

interface Participant {
  userId: string
  username: string
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
  isLocal?: boolean
  hasVideo: boolean
  hasAudio: boolean
  isMuted: boolean
  isVideoOff: boolean
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  // Initialize local media stream
  const initializeLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      setIsConnecting(true)
      
      console.log('Initializing media stream:', { video, audio })
      
      const constraints: MediaStreamConstraints = {
        video: video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
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

      console.log('Media stream initialized successfully:', {
        videoEnabled: video && videoTracks.length > 0,
        audioEnabled: audio && audioTracks.length > 0
      })

      return stream
    } catch (error: any) {
      console.error('Failed to get user media:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access denied. Please enable permissions and try again.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.')
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/microphone is being used by another application.')
      } else {
        toast.error('Failed to access camera/microphone')
      }
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
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
    }
    
    // If no video tracks, try to add video
    if (!isVideoEnabled) {
      initializeLocalStream(true, isAudioEnabled)
        .then(() => {
          setIsVideoEnabled(true)
          console.log('Video initialized and enabled')
        })
        .catch(error => {
          console.error('Failed to enable video:', error)
        })
    }
    
    return false
  }, [localStream, isVideoEnabled, isAudioEnabled, initializeLocalStream])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
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
    }
    return false
  }, [localStream])

  // Create peer connection for a participant
  const createPeerConnection = useCallback((participantId: string): RTCPeerConnection => {
    console.log('Creating peer connection for:', participantId)
    
    const peerConnection = new RTCPeerConnection(iceServers)

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind)
        peerConnection.addTrack(track, localStream)
      })
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate for', participantId, ':', event.candidate)
        // This would be sent through your socket service in a real implementation
      }
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Remote track received from', participantId, ':', event)
      const [remoteStream] = event.streams
      
      setParticipants(prev => {
        const updated = new Map(prev)
        const participant = updated.get(participantId)
        if (participant) {
          updated.set(participantId, {
            ...participant,
            stream: remoteStream
          })
        }
        return updated
      })

      if (options.onParticipantJoined) {
        options.onParticipantJoined({
          userId: participantId,
          stream: remoteStream
        })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${participantId}: ${peerConnection.connectionState}`)
      if (peerConnection.connectionState === 'failed') {
        console.error('Peer connection failed for:', participantId)
        toast.error(`Connection failed with ${participantId}`)
      }
    }

    peerConnections.current.set(participantId, peerConnection)
    return peerConnection
  }, [localStream, options])

  // Add participant
  const addParticipant = useCallback((participant: Omit<Participant, 'isLocal'>) => {
    console.log('Adding participant:', participant.userId)
    
    setParticipants(prev => {
      if (prev.size >= (options.maxParticipants || 5)) {
        toast.error('Maximum participants reached')
        return prev
      }

      const updated = new Map(prev)
      updated.set(participant.userId, {
        ...participant,
        isLocal: false
      })
      return updated
    })

    // Create peer connection for this participant
    createPeerConnection(participant.userId)
  }, [createPeerConnection, options.maxParticipants])

  // Remove participant
  const removeParticipant = useCallback((userId: string) => {
    console.log('Removing participant:', userId)
    
    setParticipants(prev => {
      const updated = new Map(prev)
      updated.delete(userId)
      return updated
    })

    // Close peer connection
    const peerConnection = peerConnections.current.get(userId)
    if (peerConnection) {
      peerConnection.close()
      peerConnections.current.delete(userId)
    }

    if (options.onParticipantLeft) {
      options.onParticipantLeft(userId)
    }
  }, [options])

  // Update participant
  const updateParticipant = useCallback((userId: string, updates: Partial<Participant>) => {
    console.log('Updating participant:', userId, updates)
    
    setParticipants(prev => {
      const updated = new Map(prev)
      const participant = updated.get(userId)
      if (participant) {
        updated.set(userId, { ...participant, ...updates })
      }
      return updated
    })
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

    // Close all peer connections
    peerConnections.current.forEach((pc, participantId) => {
      console.log('Closing peer connection for:', participantId)
      pc.close()
    })
    peerConnections.current.clear()

    // Clear participants
    setParticipants(new Map())
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
    participants: Array.from(participants.values()),
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