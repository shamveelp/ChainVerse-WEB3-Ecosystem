import { io, Socket } from "socket.io-client";

import {
  ChainCastParticipant,
  ChainCastReaction,
  ChatMessage
} from "@/types/socket/chaincast.types";

class ChainCastSocketService {
  public socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private currentChainCastId: string | null = null;

  async connect(token?: string): Promise<void> {
    if (this.isConnecting) return;
    if (this.socket?.connected) return;

    this.isConnecting = true;
    this.reconnectAttempts = 0;

    return new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = `${apiUrl}/chaincast`;

      console.log('🔌 Connecting to ChainCast socket:', socketUrl);

      this.cleanup();

      this.socket = io(socketUrl, {
        auth: { token: token || 'liberal-token' },
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      const timeout = setTimeout(() => {
        console.log('⏰ Connection timeout, but continuing...');
        this.isConnecting = false;
        resolve(); // Resolve anyway for liberal connection
      }, 8000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ ChainCast socket connected", { socketId: this.socket?.id });
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.setupEventHandlers();
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.warn("⚠️ ChainCast socket connection error:", error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(timeout);
          this.cleanup();
          reject(error);
        }
        // Don't reject immediately, let reconnection work
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ ChainCast socket disconnected:", reason);
        this.isConnecting = false;

        // Auto-reconnect for liberal connection
        if (reason === 'io server disconnect') {
          setTimeout(() => this.connect(token), 1000);
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log("🔄 ChainCast socket reconnected after", attemptNumber, "attempts");
        this.reconnectAttempts = 0;
        this.setupEventHandlers();
      });

      this.socket.on("error", (error) => {
        console.warn("🐛 ChainCast socket error:", error);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Remove existing listeners to prevent duplicates
    this.socket.removeAllListeners();

    // Re-add connection event handlers
    this.socket.on("disconnect", (reason) => {
      console.log("❌ ChainCast socket disconnected:", reason);
    });

    this.socket.on("error", (error) => {
      console.warn("🐛 ChainCast socket error:", error);
    });
  }

  private cleanup(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  disconnect(): void {
    console.log('🔌 Disconnecting ChainCast socket');
    this.cleanup();
    this.currentChainCastId = null;
  }

  // ChainCast room management with liberal approach
  async joinChainCast(chainCastId: string): Promise<void> {
    console.log('🚀 Joining ChainCast:', chainCastId);

    if (!this.socket) {
      await this.connect();
    }

    this.currentChainCastId = chainCastId;

    if (this.socket?.connected) {
      this.socket.emit("join_chaincast", { chainCastId });
    } else {
      // Liberal fallback - emit when connected
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit("join_chaincast", { chainCastId });
        }
      }, 1000);
    }
  }

  leaveChainCast(chainCastId: string): void {
    if (this.socket?.connected && chainCastId) {
      console.log('🚪 Leaving ChainCast:', chainCastId);
      this.socket.emit("leave_chaincast", { chainCastId });
    }
    this.currentChainCastId = null;
  }

  // Stream management
  updateStream(data: {
    chainCastId: string;
    hasVideo: boolean;
    hasAudio: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
  }): void {
    if (this.socket?.connected) {
      console.log("📹 Updating stream:", data);
      this.socket.emit("stream_update", data);
    }
  }

  // Chat with retry mechanism
  sendMessage(chainCastId: string, message: string): void {
    if (!message.trim()) return;

    const messageData = { chainCastId, message: message.trim() };
    console.log('💬 Sending message:', messageData);

    if (this.socket?.connected) {
      this.socket.emit("send_message", messageData);
    } else {
      // Liberal retry
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit("send_message", messageData);
        }
      }, 500);
    }
  }

  // Reactions with retry
  addReaction(chainCastId: string, emoji: string): void {
    const reactionData = { chainCastId, emoji };
    console.log('😀 Adding reaction:', reactionData);

    if (this.socket?.connected) {
      this.socket.emit("add_reaction", reactionData);
    } else {
      // Liberal retry
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit("add_reaction", reactionData);
        }
      }, 500);
    }
  }

  // Moderation
  requestModeration(data: {
    chainCastId: string;
    requestedPermissions: { video: boolean; audio: boolean };
    message?: string;
  }): void {
    console.log("🛡️ Requesting moderation:", data);

    if (this.socket?.connected) {
      this.socket.emit("request_moderation", data);
    }
  }

  // Admin: Approve Moderation
  approveModeration(chainCastId: string, targetUserId: string): void {
    console.log('👑 Approving moderation:', { chainCastId, targetUserId });
    if (this.socket?.connected) {
      this.socket.emit('admin_action', {
        action: 'approve_moderation',
        chainCastId,
        targetUserId
      });
    }
  }

  // Liberal event listeners - no off/on pattern to prevent issues
  onJoinedChainCast(callback: (data: { chainCastId: string; participantCount: number; userRole: string }) => void): void {
    if (this.socket) {
      this.socket.on("joined_chaincast", callback);
    }
  }

  onLeftChainCast(callback: (data: { chainCastId: string; participantCount: number }) => void): void {
    if (this.socket) {
      this.socket.on("left_chaincast", callback);
    }
  }

  onParticipantJoined(callback: (participant: ChainCastParticipant) => void): void {
    if (this.socket) {
      this.socket.on("participant_joined", (data) => {
        console.log('👤 Participant joined:', data);
        callback(data);
      });
    }
  }

  onParticipantLeft(callback: (participant: ChainCastParticipant) => void): void {
    if (this.socket) {
      this.socket.on("participant_left", (data) => {
        console.log('👤 Participant left:', data);
        callback(data);
      });
    }
  }

  onParticipantStreamUpdate(callback: (data: ChainCastParticipant) => void): void {
    if (this.socket) {
      this.socket.on("participant_stream_update", callback);
    }
  }

  onNewMessage(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on("new_message", (data) => {
        console.log('💬 New message received:', data);
        callback(data);
      });
    }
  }

  onMessageSent(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on("message_sent", (data) => {
        console.log('✅ Message sent confirmation:', data);
        callback(data);
      });
    }
  }

  onStreamUpdateError(callback: (data: { error: string }) => void): void {
    if (this.socket) {
      this.socket.on("stream_update_error", (data) => {
        console.log('❌ Stream update error:', data);
        callback(data);
      });
    }
  }

  // WebRTC signaling methods
  sendWebRTCOffer(chainCastId: string, toUserId: string, offer: RTCSessionDescriptionInit): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_offer", { chainCastId, toUserId, offer });
    }
  }

  sendWebRTCAnswer(chainCastId: string, toUserId: string, answer: RTCSessionDescriptionInit): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_answer", { chainCastId, toUserId, answer });
    }
  }

  sendWebRTCIceCandidate(chainCastId: string, toUserId: string, candidate: RTCIceCandidateInit): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_ice_candidate", { chainCastId, toUserId, candidate });
    }
  }

  onWebRTCOffer(callback: (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => void): void {
    if (this.socket) {
      this.socket.on("webrtc_offer", (data) => {
        console.log('📥 WebRTC offer received:', data);
        callback(data);
      });
    }
  }

  onWebRTCAnswer(callback: (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => void): void {
    if (this.socket) {
      this.socket.on("webrtc_answer", (data) => {
        console.log('📥 WebRTC answer received:', data);
        callback(data);
      });
    }
  }

  onWebRTCIceCandidate(callback: (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => void): void {
    if (this.socket) {
      this.socket.on("webrtc_ice_candidate", (data) => {
        console.log('🧊 WebRTC ICE candidate received:', data);
        callback(data);
      });
    }
  }

  onNewReaction(callback: (reaction: ChainCastReaction) => void): void {
    if (this.socket) {
      this.socket.on("new_reaction", (data) => {
        console.log('😀 New reaction received:', data);
        callback(data);
      });
    }
  }

  onModerationRequested(callback: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on("moderation_requested", callback);
    }
  }

  onModerationReviewed(callback: (data: {
    requestId: string;
    status: 'approved' | 'rejected';
    adminName: string;
    timestamp: Date;
  }) => void): void {
    if (this.socket) {
      this.socket.on("moderation_reviewed", callback);
    }
  }

  onModerationApproved(callback: (data: { approvedBy: string }) => void): void {
    if (this.socket) {
      this.socket.on("moderation_approved", callback);
    }
  }

  onModerationRejected(callback: (data: { rejectedBy: string }) => void): void {
    if (this.socket) {
      this.socket.on("moderation_rejected", callback);
    }
  }

  onChainCastStarted(callback: (data: { adminId: string; adminName: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on("chaincast_started", callback);
    }
  }

  onChainCastEnded(callback: (data?: { adminId: string; adminName: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on("chaincast_ended", (data) => {
        console.log('🔴 ChainCast ended:', data);
        callback(data);
      });
    }
  }

  onRemovedFromChainCast(callback: (data: { adminName: string; reason?: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on("removed_from_chaincast", callback);
    }
  }

  // Error handlers
  onJoinError(callback: (data: { error: string }) => void): void {
    if (this.socket) {
      this.socket.on("join_error", callback);
    }
  }

  onError(callback: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getCurrentChainCastId(): string | null {
    return this.currentChainCastId;
  }

  // Liberal connection check
  ensureConnection(token?: string): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    return this.connect(token);
  }
}

export const chainCastSocketService = new ChainCastSocketService();
export type { ChainCastReaction, ChatMessage } from "@/types/socket/chaincast.types";