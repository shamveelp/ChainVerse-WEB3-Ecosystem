import { useState, useEffect, useRef, useCallback } from 'react'
import { chainCastSocketService } from '@/services/socket/chainCastSocketService'

interface UseChainCastWebRTCOptions {
  chainCastId: string
  isAdmin: boolean
  localStream: MediaStream | null
  userId: string
}

interface RemoteStream {
  userId: string
  stream: MediaStream
  videoRef: React.RefObject<HTMLVideoElement>
}

export const useChainCastWebRTC = (options: UseChainCastWebRTCOptions) => {
  const { chainCastId, isAdmin, localStream, userId } = options
  
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const isInitializedRef = useRef(false)

  // WebRTC configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // Cleanup peer connection - must be defined first
  const cleanupPeerConnection = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (pc) {
      pc.close()
      peerConnectionsRef.current.delete(userId)
      console.log('🧹 Cleaned up peer connection for:', userId)
    }

    setRemoteStreams(prev => {
      const newMap = new Map(prev)
      newMap.delete(userId)
      return newMap
    })

    const videoElement = remoteVideoRefsRef.current.get(userId)
    if (videoElement) {
      videoElement.srcObject = null
      remoteVideoRefsRef.current.delete(userId)
    }
  }, [])

  // Handle WebRTC answer (admin side)
  const handleWebRTCAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionsRef.current.get(fromUserId)
      if (!pc) {
        console.error('❌ No peer connection found for viewer:', fromUserId)
        return
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('✅ WebRTC answer set for viewer:', fromUserId)

    } catch (error) {
      console.error('❌ Failed to handle WebRTC answer:', error)
    }
  }, [])

  // Handle ICE candidate
  const handleIceCandidate = useCallback((fromUserId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionsRef.current.get(fromUserId)
      if (!pc) {
        console.error('❌ No peer connection found for:', fromUserId)
        return
      }

      pc.addIceCandidate(new RTCIceCandidate(candidate))
      console.log('✅ Added ICE candidate for:', fromUserId)

    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error)
    }
  }, [])

  // Create peer connection for a viewer (admin side)
  const createPeerConnectionForViewer = useCallback(async (viewerUserId: string) => {
    if (!localStream) {
      console.error('❌ Cannot create peer connection: no local stream')
      return
    }

    try {
      const pc = new RTCPeerConnection(rtcConfiguration)
      peerConnectionsRef.current.set(viewerUserId, pc)

      // Add local stream tracks to peer connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
        console.log('➕ Added track to peer connection:', track.kind, track.id)
      })

      // Handle ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to viewer:', viewerUserId)
          chainCastSocketService.sendWebRTCIceCandidate(chainCastId, viewerUserId, event.candidate)
        }
      }

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('🔗 Peer connection state:', viewerUserId, pc.connectionState)
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          cleanupPeerConnection(viewerUserId)
        }
      }

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      console.log('📤 Sending WebRTC offer to viewer:', viewerUserId)
      chainCastSocketService.sendWebRTCOffer(chainCastId, viewerUserId, offer)

    } catch (error) {
      console.error('❌ Failed to create peer connection for viewer:', error)
    }
  }, [localStream, chainCastId, cleanupPeerConnection])

  // Request admin stream (viewer side)
  const requestAdminStream = useCallback(async (adminUserId: string) => {
    try {
      const pc = new RTCPeerConnection(rtcConfiguration)
      peerConnectionsRef.current.set(adminUserId, pc)

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📹 Received remote track from admin:', event.track.kind)
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0]
          setRemoteStreams(prev => {
            const newMap = new Map(prev)
            newMap.set(adminUserId, remoteStream)
            return newMap
          })
          
          // Set video element source
          const videoElement = remoteVideoRefsRef.current.get(adminUserId)
          if (videoElement) {
            videoElement.srcObject = remoteStream
            console.log('📺 Set remote video element source')
          }
        }
      }

      // Handle ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to admin:', adminUserId)
          chainCastSocketService.sendWebRTCIceCandidate(chainCastId, adminUserId, event.candidate)
        }
      }

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('🔗 Peer connection state:', adminUserId, pc.connectionState)
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          cleanupPeerConnection(adminUserId)
        }
      }

    } catch (error) {
      console.error('❌ Failed to request admin stream:', error)
    }
  }, [chainCastId, cleanupPeerConnection])

  // Handle WebRTC offer (viewer side)
  const handleWebRTCOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      let pc = peerConnectionsRef.current.get(fromUserId)
      
      if (!pc) {
        // Create new peer connection if it doesn't exist
        pc = new RTCPeerConnection(rtcConfiguration)
        peerConnectionsRef.current.set(fromUserId, pc)

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log('📹 Received remote track:', event.track.kind)
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0]
            setRemoteStreams(prev => {
              const newMap = new Map(prev)
              newMap.set(fromUserId, remoteStream)
              return newMap
            })
            
            // Set video element source
            const videoElement = remoteVideoRefsRef.current.get(fromUserId)
            if (videoElement) {
              videoElement.srcObject = remoteStream
              console.log('📺 Set remote video element source')
            }
          }
        }

        // Handle ICE candidate
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            chainCastSocketService.sendWebRTCIceCandidate(chainCastId, fromUserId, event.candidate)
          }
        }

        // Handle connection state
        pc.onconnectionstatechange = () => {
          console.log('🔗 Peer connection state:', fromUserId, pc.connectionState)
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            cleanupPeerConnection(fromUserId)
          }
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      console.log('📤 Sending WebRTC answer to admin:', fromUserId)
      chainCastSocketService.sendWebRTCAnswer(chainCastId, fromUserId, answer)

    } catch (error) {
      console.error('❌ Failed to handle WebRTC offer:', error)
    }
  }, [chainCastId, cleanupPeerConnection])

  // Setup WebRTC signaling via Socket.IO
  const setupWebRTCSignaling = useCallback(() => {
    // Handle offer from admin (viewer receives)
    const offerHandler = (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      if (isAdmin) return // Admin doesn't receive offers
      
      console.log('📥 Received WebRTC offer from admin:', data.fromUserId)
      handleWebRTCOffer(data.fromUserId, data.offer)
    }
    chainCastSocketService.onWebRTCOffer(offerHandler)

    // Handle answer from viewer (admin receives)
    const answerHandler = (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (!isAdmin) return // Only admin receives answers
      
      console.log('📥 Received WebRTC answer from viewer:', data.fromUserId)
      handleWebRTCAnswer(data.fromUserId, data.answer)
    }
    chainCastSocketService.onWebRTCAnswer(answerHandler)

    // Handle ICE candidate
    const iceHandler = (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      console.log('🧊 Received ICE candidate from:', data.fromUserId)
      handleIceCandidate(data.fromUserId, data.candidate)
    }
    chainCastSocketService.onWebRTCIceCandidate(iceHandler)

    // Handle participant joined - create peer connection
    const participantHandler = (participant: any) => {
      if (isAdmin && localStream && participant.userId !== userId) {
        console.log('👤 New viewer joined, creating peer connection:', participant.userId)
        createPeerConnectionForViewer(participant.userId)
      } else if (!isAdmin && participant.userType === 'communityAdmin') {
        console.log('👑 Admin joined, requesting stream')
        requestAdminStream(participant.userId)
      }
    }
    chainCastSocketService.onParticipantJoined(participantHandler)
  }, [isAdmin, localStream, userId, chainCastId, handleWebRTCOffer, handleWebRTCAnswer, handleIceCandidate, createPeerConnectionForViewer, requestAdminStream])

  // Initialize WebRTC for admin - send stream to all viewers
  const initializeAdminWebRTC = useCallback(async () => {
    if (!isAdmin || !localStream) {
      console.log('⚠️ Admin WebRTC: No local stream available')
      return
    }

    console.log('🎬 Initializing admin WebRTC with stream:', {
      videoTracks: localStream.getVideoTracks().length,
      audioTracks: localStream.getAudioTracks().length
    })

    // Setup socket listeners for WebRTC signaling
    setupWebRTCSignaling()
  }, [isAdmin, localStream, setupWebRTCSignaling])

  // Initialize WebRTC for viewer - receive admin stream
  const initializeViewerWebRTC = useCallback(async () => {
    if (isAdmin) return

    console.log('👁️ Initializing viewer WebRTC to receive admin stream')
    setupWebRTCSignaling()
  }, [isAdmin, setupWebRTCSignaling])

  // Register remote video element
  const registerRemoteVideoRef = useCallback((userId: string, videoElement: HTMLVideoElement | null) => {
    if (videoElement) {
      remoteVideoRefsRef.current.set(userId, videoElement)
      
      // If stream already exists, set it
      const stream = remoteStreams.get(userId)
      if (stream) {
        videoElement.srcObject = stream
      }
    } else {
      remoteVideoRefsRef.current.delete(userId)
    }
  }, [remoteStreams])

  // Initialize based on role
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    if (isAdmin) {
      if (localStream) {
        initializeAdminWebRTC()
      }
    } else {
      initializeViewerWebRTC()
    }
  }, [isAdmin, localStream, initializeAdminWebRTC, initializeViewerWebRTC])

  // Update local stream tracks when stream changes (admin)
  useEffect(() => {
    if (!isAdmin || !localStream) return

    // Update all peer connections with new tracks
    peerConnectionsRef.current.forEach((pc, userId) => {
      const senders = pc.getSenders()
      
      // Update video track
      const videoTrack = localStream.getVideoTracks()[0]
      const videoSender = senders.find(s => s.track?.kind === 'video')
      if (videoTrack && videoSender) {
        videoSender.replaceTrack(videoTrack)
      } else if (videoTrack && !videoSender) {
        pc.addTrack(videoTrack, localStream)
      }

      // Update audio track
      const audioTrack = localStream.getAudioTracks()[0]
      const audioSender = senders.find(s => s.track?.kind === 'audio')
      if (audioTrack && audioSender) {
        audioSender.replaceTrack(audioTrack)
      } else if (audioTrack && !audioSender) {
        pc.addTrack(audioTrack, localStream)
      }
    })
  }, [isAdmin, localStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach((pc, userId) => {
        pc.close()
      })
      peerConnectionsRef.current.clear()
      remoteVideoRefsRef.current.clear()
    }
  }, [])

  return {
    remoteStreams,
    registerRemoteVideoRef
  }
}

