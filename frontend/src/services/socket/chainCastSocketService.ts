import { io, Socket } from "socket.io-client";
import { store } from "@/redux/store";

export interface ChainCastParticipant {
  userId: string;
  username: string;
  userType: 'user' | 'communityAdmin';
  hasVideo?: boolean;
  hasAudio?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface ChainCastReaction {
  userId: string;
  username: string;
  emoji: string;
  timestamp: Date;
}

interface ModerationRequest {
  userId: string;
  username: string;
  requestedPermissions: {
    video: boolean;
    audio: boolean;
  };
  message?: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

class ChainCastSocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private currentToken: string | null = null;
  private currentChainCastId: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async connect(token: string): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      return this.connectionPromise || Promise.resolve();
    }

    // If already connected, return immediately
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      console.warn("No valid token provided to ChainCast socket");
      return Promise.reject(new Error("No valid token provided"));
    }

    // Store current token for reconnection
    this.currentToken = token;
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = `${apiUrl}/chaincast`;

      

      // Disconnect any existing socket first
      this.cleanupSocket();

      this.socket = io(socketUrl, {
        auth: {
          token: token.trim(),
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: false, // Handle reconnection manually
      });

      const timeout = setTimeout(() => {
        console.error("ChainCast socket connection timeout");
        this.cleanupConnection();
        reject(new Error("ChainCast socket connection timeout"));
      }, 15000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ Connected to ChainCast socket", {
          socketId: this.socket?.id,
          transport: this.socket?.io.engine?.transport?.name
        });
        this.isConnecting = false;
        this.connectionPromise = null;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("❌ ChainCast socket connection error:", {
          message: error.message,
          type: error.toString()
        });

        this.cleanupConnection();

        if (
          error.message?.includes("Authentication failed") ||
          error.message?.includes("Token expired") ||
          error.message?.includes("Invalid token")
        ) {
          reject(new Error("Authentication failed - token may be expired"));
        } else {
          reject(error);
        }
      });

      this.setupEventListeners();
    });

    return this.connectionPromise;
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private cleanupConnection(): void {
    this.isConnecting = false;
    this.connectionPromise = null;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      
      this.cleanupConnection();

      // Handle reconnection manually with delay
      if (reason === "io server disconnect" || reason === "transport error") {
        this.scheduleReconnect();
      }
    });

    this.socket.on("error", (error) => {
      console.error("🚨 ChainCast socket error:", error);
      this.cleanupConnection();
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isConnecting) {
      console.error("Max reconnection attempts reached or already connecting");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

    

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectSocket();
    }, delay);
  }

  private async reconnectSocket(): Promise<void> {
    

    try {
      // Get fresh token from Redux store
      const token = this.getCurrentToken();
      if (token) {
        await this.connect(token);

        // Rejoin ChainCast if we were in one
        if (this.currentChainCastId) {
          await this.joinChainCast(this.currentChainCastId);
        }
      } else {
        console.error("No token available for reconnection");
      }
    } catch (error) {
      console.error("Manual reconnection failed:", error);
      this.scheduleReconnect();
    }
  }

  private getCurrentToken(): string | null {
    try {
      // Get token from Redux store
      const state = store.getState();
      const userToken = state?.userAuth?.token;
      const adminToken = state?.communityAdminAuth?.token;

      // Return the current token we're using, or try to get from store
      return this.currentToken || adminToken || userToken || null;
    } catch (e) {
      console.warn("Could not get token from Redux store for reconnection");
      return this.currentToken;
    }
  }

  disconnect(): void {
    
    this.cleanupSocket();
    this.cleanupConnection();
    this.reconnectAttempts = 0;
    this.currentToken = null;
    this.currentChainCastId = null;
  }

  // ChainCast room management
  async joinChainCast(chainCastId: string): Promise<void> {
    if (this.socket?.connected) {
      
      this.currentChainCastId = chainCastId;
      this.socket.emit("join_chaincast", { chainCastId });
    } else {
      console.warn("Cannot join ChainCast - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  leaveChainCast(chainCastId: string): void {
    if (this.socket?.connected) {
      
      this.socket.emit("leave_chaincast", { chainCastId });
      if (this.currentChainCastId === chainCastId) {
        this.currentChainCastId = null;
      }
    } else {
      console.warn("Cannot leave ChainCast - socket not connected");
    }
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
      console.log("📹 Updating stream:", {
        chainCastId: data.chainCastId,
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio
      });
      this.socket.emit("stream_update", data);
    } else {
      console.warn("Cannot update stream - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Chat
  sendMessage(chainCastId: string, message: string): void {
    if (this.socket?.connected) {
      
      this.socket.emit("send_message", { chainCastId, message });
    } else {
      console.warn("Cannot send message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Reactions
  addReaction(chainCastId: string, emoji: string): void {
    if (this.socket?.connected) {
      
      this.socket.emit("add_reaction", { chainCastId, emoji });
    } else {
      console.warn("Cannot add reaction - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Moderation (for users)
  requestModeration(data: {
    chainCastId: string;
    requestedPermissions: {
      video: boolean;
      audio: boolean;
    };
    message?: string;
  }): void {
    if (this.socket?.connected) {
      console.log("🛡️ Requesting moderation:", {
        chainCastId: data.chainCastId,
        requestedPermissions: data.requestedPermissions
      });
      this.socket.emit("request_moderation", data);
    } else {
      console.warn("Cannot request moderation - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Admin actions
  performAdminAction(data: {
    action: 'start' | 'end' | 'remove_participant' | 'approve_moderation' | 'reject_moderation';
    chainCastId: string;
    targetUserId?: string;
    requestId?: string;
    reason?: string;
  }): void {
    if (this.socket?.connected) {
      console.log("⚡ Performing admin action:", {
        action: data.action,
        chainCastId: data.chainCastId
      });
      this.socket.emit("admin_action", data);
    } else {
      console.warn("Cannot perform admin action - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // WebRTC signaling
  sendWebRTCSignal(data: {
    chainCastId: string;
    targetUserId: string;
    signal: any;
    type: 'offer' | 'answer' | 'ice-candidate';
  }): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_signal", data);
    } else {
      console.warn("Cannot send WebRTC signal - socket not connected");
    }
  }

  // Event listeners
  onJoinedChainCast(callback: (data: { chainCastId: string; participantCount: number }) => void): void {
    this.socket?.on("joined_chaincast", callback);
  }

  onLeftChainCast(callback: (data: { chainCastId: string; participantCount: number }) => void): void {
    this.socket?.on("left_chaincast", callback);
  }

  onParticipantJoined(callback: (participant: ChainCastParticipant) => void): void {
    this.socket?.on("participant_joined", callback);
  }

  onParticipantLeft(callback: (participant: ChainCastParticipant) => void): void {
    this.socket?.on("participant_left", callback);
  }

  onParticipantStreamUpdate(callback: (data: ChainCastParticipant) => void): void {
    this.socket?.on("participant_stream_update", callback);
  }

  onNewMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on("new_message", callback);
  }

  onNewReaction(callback: (reaction: ChainCastReaction) => void): void {
    this.socket?.on("new_reaction", callback);
  }

  onModerationRequest(callback: (request: ModerationRequest) => void): void {
    this.socket?.on("moderation_request", callback);
  }

  onModerationRequested(callback: (data: { message: string }) => void): void {
    this.socket?.on("moderation_requested", callback);
  }

  onModerationReviewed(callback: (data: {
    requestId: string;
    status: 'approved' | 'rejected';
    adminName: string;
    timestamp: Date;
  }) => void): void {
    this.socket?.on("moderation_reviewed", callback);
  }

  onChainCastStarted(callback: (data: {
    adminId: string;
    adminName: string;
    timestamp: Date;
  }) => void): void {
    this.socket?.on("chaincast_started", callback);
  }

  onChainCastEnded(callback: (data: {
    adminId: string;
    adminName: string;
    timestamp: Date;
  }) => void): void {
    this.socket?.on("chaincast_ended", callback);
  }

  onRemovedFromChainCast(callback: (data: {
    adminName: string;
    reason?: string;
    timestamp: Date;
  }) => void): void {
    this.socket?.on("removed_from_chaincast", callback);
  }

  onAdminActionSuccess(callback: (data: {
    action: string;
    message: string;
  }) => void): void {
    this.socket?.on("admin_action_success", callback);
  }

  onWebRTCSignal(callback: (data: {
    fromUserId: string;
    fromUsername: string;
    signal: any;
    type: 'offer' | 'answer' | 'ice-candidate';
  }) => void): void {
    this.socket?.on("webrtc_signal", callback);
  }

  // Error handlers
  onJoinError(callback: (data: { error: string }) => void): void {
    this.socket?.on("join_error", callback);
  }

  onReactionError(callback: (data: { error: string }) => void): void {
    this.socket?.on("reaction_error", callback);
  }

  onModerationError(callback: (data: { error: string }) => void): void {
    this.socket?.on("moderation_error", callback);
  }

  onAdminError(callback: (data: { error: string }) => void): void {
    this.socket?.on("admin_error", callback);
  }

  onWebRTCError(callback: (data: { error: string }) => void): void {
    this.socket?.on("webrtc_error", callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.on("error", callback);
  }

  // Remove listeners
  offJoinedChainCast(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("joined_chaincast", callback);
    } else {
      this.socket?.removeAllListeners("joined_chaincast");
    }
  }

  offParticipantJoined(callback?: (participant: ChainCastParticipant) => void): void {
    if (callback) {
      this.socket?.off("participant_joined", callback);
    } else {
      this.socket?.removeAllListeners("participant_joined");
    }
  }

  offParticipantLeft(callback?: (participant: ChainCastParticipant) => void): void {
    if (callback) {
      this.socket?.off("participant_left", callback);
    } else {
      this.socket?.removeAllListeners("participant_left");
    }
  }

  offNewMessage(callback?: (message: ChatMessage) => void): void {
    if (callback) {
      this.socket?.off("new_message", callback);
    } else {
      this.socket?.removeAllListeners("new_message");
    }
  }

  offNewReaction(callback?: (reaction: ChainCastReaction) => void): void {
    if (callback) {
      this.socket?.off("new_reaction", callback);
    } else {
      this.socket?.removeAllListeners("new_reaction");
    }
  }

  offModerationRequest(callback?: (request: ModerationRequest) => void): void {
    if (callback) {
      this.socket?.off("moderation_request", callback);
    } else {
      this.socket?.removeAllListeners("moderation_request");
    }
  }

  offChainCastStarted(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("chaincast_started", callback);
    } else {
      this.socket?.removeAllListeners("chaincast_started");
    }
  }

  offChainCastEnded(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("chaincast_ended", callback);
    } else {
      this.socket?.removeAllListeners("chaincast_ended");
    }
  }

  offAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getConnectionState(): string {
    if (!this.socket) return "disconnected";
    if (this.socket.connected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }

  getCurrentChainCastId(): string | null {
    return this.currentChainCastId;
  }

  // Expose socket for direct access if needed
  // get socket(): Socket | null {
  //   return this.socket;
  // }
}

export const chainCastSocketService = new ChainCastSocketService();
export type { ChainCastReaction, ModerationRequest, ChatMessage };