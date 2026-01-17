import { useState, useEffect, useRef, useCallback } from 'react'
import { chainCastSocketService } from '@/services/socket/chainCastSocketService'
import { ChainCastParticipant } from '@/types/socket/chaincast.types'

interface UseChainCastWebRTCOptions {
  chainCastId: string
  isAdmin: boolean
  localStream: MediaStream | null
  userId: string
  participants: ChainCastParticipant[] // Pass current participants list
}

interface RemoteStream {
  userId: string
  stream: MediaStream
  videoRef: React.RefObject<HTMLVideoElement>
}

export const useChainCastWebRTC = (options: UseChainCastWebRTCOptions) => {
  const { chainCastId, isAdmin, localStream, userId, participants } = options

  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
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

    // Clear queue
    iceCandidatesQueueRef.current.delete(userId)
  }, [])

  // Handle WebRTC answer (admin side)
  const handleWebRTCAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionsRef.current.get(fromUserId)
      if (!pc) {
        console.error('❌ No peer connection found for viewer:', fromUserId)
        return
      }

      // Check signaling state before setting remote description
      if (pc.signalingState === 'stable') {
        console.warn('⚠️ Peer connection already in stable state, ignoring answer from:', fromUserId)
        return
      }

      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`⚠️ Unexpected signaling state: ${pc.signalingState}, expected 'have-local-offer'`)
        return
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('✅ WebRTC answer set for viewer:', fromUserId)

      // Process queued candidates if any
      const queue = iceCandidatesQueueRef.current.get(fromUserId)
      if (queue && queue.length > 0) {
        console.log(`🧊 Processing ${queue.length} queued ICE candidates for ${fromUserId}`)
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (err) {
            console.error('Failed to add queued candidate:', err)
          }
        }
        iceCandidatesQueueRef.current.delete(fromUserId)
      }

    } catch (error) {
      console.error('❌ Failed to handle WebRTC answer:', error)
    }
  }, [])

  // Handle ICE candidate
  const handleIceCandidate = useCallback((fromUserId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionsRef.current.get(fromUserId)

      // Queue if no PC or (for viewer receiving offer) if remote description not set
      // Actually, standard practice: if PC exists, add it. The browser handles buffering if needed, 
      // BUT explicitly waiting for remoteDescription is safer for race conditions.

      const shouldQueue = !pc || (!pc.remoteDescription && pc.signalingState === 'stable');

      if (shouldQueue) {
        console.log('🧊 Queuing ICE candidate for:', fromUserId)
        const queue = iceCandidatesQueueRef.current.get(fromUserId) || []
        queue.push(candidate)
        iceCandidatesQueueRef.current.set(fromUserId, queue)
        return
      }

      pc!.addIceCandidate(new RTCIceCandidate(candidate))
      console.log('✅ Added ICE candidate for:', fromUserId)

    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error)
    }
  }, [])

  // Create peer connection for a viewer (admin side)
  const createPeerConnectionForViewer = useCallback(async (viewerUserId: string, isRenegotiation = false) => {
    if (!localStream) {
      console.error('❌ Cannot create peer connection: no local stream')
      return
    }

    try {
      // If PC exists and not renegotiating, skip
      if (peerConnectionsRef.current.has(viewerUserId) && !isRenegotiation) {
        console.log('⚠️ Peer connection already exists for:', viewerUserId)
        return
      }

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
          // Optional: Try to reconnect?
          console.warn('⚠️ Connection failed/disconnected for', viewerUserId)
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
    // We don't necessarily need to create a PC here if we expect an Offer.
    // However, creating it purely to handle the incoming tracks is fine.
    // BUT we must be careful not to conflict with handleWebRTCOffer.
    // LET'S SIMPLIFY: Just wait for the offer.
    // Admin sends offer on join. We assume one of those two triggers.
    console.log('👀 Ready to receive admin stream from:', adminUserId)

    // We do NOTHING here. We rely on the Admin to send the offer.
    // If the Admin joined AFTER us, they will send an offer via `initializeAdminWebRTC`.
    // If the Admin was ALREADY there, they might have sent an offer we missed?
    // No, if we just joined, Admin gets `participant_joined` and sends offer.

    // EXCEPT: If we reloaded page? Admin logic handles `participant_joined`.
    // So usually we don't need to initiate.
  }, [])

  // Handle WebRTC offer (viewer side)
  const handleWebRTCOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      let pc = peerConnectionsRef.current.get(fromUserId)

      // Always create new PC if receiving offer, to ensure clean state? 
      // Or reuse if exists? Reuse is risky if state is bad.
      // Let's create new if connection is closed or garbage.

      if (pc) {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close()
          peerConnectionsRef.current.delete(fromUserId)
          pc = undefined
        }
      }

      if (!pc) {
        // Create new peer connection if it doesn't exist
        const newPc = new RTCPeerConnection(rtcConfiguration)
        pc = newPc
        peerConnectionsRef.current.set(fromUserId, newPc)

        // Handle remote stream
        newPc.ontrack = (event) => {
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
        newPc.onicecandidate = (event) => {
          if (event.candidate) {
            chainCastSocketService.sendWebRTCIceCandidate(chainCastId, fromUserId, event.candidate)
          }
        }

        // Handle connection state
        newPc.onconnectionstatechange = () => {
          console.log('🔗 Peer connection state:', fromUserId, newPc.connectionState)
          if (newPc.connectionState === 'failed' || newPc.connectionState === 'disconnected') {
            cleanupPeerConnection(fromUserId)
          }
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Flush ICE queue
      const queue = iceCandidatesQueueRef.current.get(fromUserId)
      if (queue && queue.length > 0) {
        console.log(`🧊 Processing ${queue.length} queued ICE candidates for ${fromUserId}`)
        queue.forEach(candidate => {
          pc!.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('Failed to add queued candidate:', err))
        })
        iceCandidatesQueueRef.current.delete(fromUserId)
      }

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
      // console.log('🧊 Received ICE candidate from:', data.fromUserId)
      handleIceCandidate(data.fromUserId, data.candidate)
    }
    chainCastSocketService.onWebRTCIceCandidate(iceHandler)

    // Handle participant joined - create peer connection
    const participantHandler = (participant: ChainCastParticipant) => {
      if (isAdmin && localStream && participant.userId !== userId) {
        console.log('👤 New viewer joined, creating peer connection:', participant.userId)
        createPeerConnectionForViewer(participant.userId)
      } else if (!isAdmin && participant.userType === 'communityAdmin') {
        // simplified: do nothing, expect offer
      }
    }
    chainCastSocketService.onParticipantJoined(participantHandler)
  }, [isAdmin, localStream, userId, chainCastId, handleWebRTCOffer, handleWebRTCAnswer, handleIceCandidate, createPeerConnectionForViewer])

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

    // Connect to EXISTING participants who are not me
    console.log('👥 Admin connecting to existing participants:', participants.length)
    participants.forEach(participant => {
      // Simple dedupe: make sure it's not me, and not another admin (unless we support multi-admin/p2p mesh later)
      // For now, assume One Broadcaster -> Many Viewers
      if (participant.userId !== userId && participant.userType !== 'communityAdmin') {
        if (!peerConnectionsRef.current.has(participant.userId)) {
          console.log('🔌 Creating outgoing connection for:', participant.userId)
          createPeerConnectionForViewer(participant.userId)
        }
      }
    })
  }, [isAdmin, localStream, setupWebRTCSignaling, participants, userId, createPeerConnectionForViewer])

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

  // Initialize based on role and stream availability
  useEffect(() => {
    if (isAdmin) {
      if (localStream) {
        console.log('🎥 Admin stream ready, initializing WebRTC...')
        initializeAdminWebRTC()
      } else {
        console.log('⏳ Waiting for admin local stream...')
      }
    } else {
      initializeViewerWebRTC()
    }
  }, [isAdmin, localStream, initializeAdminWebRTC, initializeViewerWebRTC])

  // Update local stream tracks when stream changes (admin)
  useEffect(() => {
    if (!isAdmin || !localStream) return

    console.log('🔄 Admin stream changed, updating all peer connections...')

    // Update all peer connections with new tracks
    peerConnectionsRef.current.forEach(async (pc, userId) => {
      try {
        const senders = pc.getSenders()
        let needsRenegotiation = false

        // Update video track
        const videoTrack = localStream.getVideoTracks()[0]
        const videoSender = senders.find(s => s.track?.kind === 'video')

        if (videoTrack && videoSender) {
          // Replace existing video track
          await videoSender.replaceTrack(videoTrack)
          console.log('✅ Replaced video track for:', userId)
        } else if (videoTrack && !videoSender) {
          // Add new video track
          pc.addTrack(videoTrack, localStream)
          needsRenegotiation = true
          console.log('➕ Added video track for:', userId)
        } else if (!videoTrack && videoSender) {
          // Remove video track by replacing with null
          await videoSender.replaceTrack(null)
          console.log('➖ Removed video track for:', userId)
        }

        // Update audio track
        const audioTrack = localStream.getAudioTracks()[0]
        const audioSender = senders.find(s => s.track?.kind === 'audio')

        if (audioTrack && audioSender) {
          // Replace existing audio track
          await audioSender.replaceTrack(audioTrack)
          console.log('✅ Replaced audio track for:', userId)
        } else if (audioTrack && !audioSender) {
          // Add new audio track
          pc.addTrack(audioTrack, localStream)
          needsRenegotiation = true
          console.log('➕ Added audio track for:', userId)
        } else if (!audioTrack && audioSender) {
          // Remove audio track by replacing with null
          await audioSender.replaceTrack(null)
          console.log('➖ Removed audio track for:', userId)
        }

        // If we added new tracks, we need to renegotiate
        if (needsRenegotiation) {
          console.log('🔄 Renegotiating connection for:', userId)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          chainCastSocketService.sendWebRTCOffer(chainCastId, userId, offer)
        }
      } catch (error) {
        console.error('❌ Failed to update tracks for:', userId, error)
      }
    })
  }, [isAdmin, localStream, chainCastId])

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

