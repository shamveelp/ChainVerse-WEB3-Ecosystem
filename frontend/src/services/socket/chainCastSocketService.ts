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
  public socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
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

      console.log('Connecting to ChainCast socket:', socketUrl);

      // Disconnect any existing socket first
      this.cleanupSocket();

      this.socket = io(socketUrl, {
        auth: {
          token: token.trim(),
        },
        transports: ["websocket", "polling"],
        timeout: 10000, // Reduced timeout
        forceNew: true,
        autoConnect: true,
        reconnection: false, // Handle reconnection manually
      });

      const timeout = setTimeout(() => {
        console.error("ChainCast socket connection timeout");
        this.cleanupConnection();
        reject(new Error("ChainCast socket connection timeout"));
      }, 8000); // Reduced timeout

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
        console.error("❌ ChainCast socket connection error:", error.message);

        this.cleanupConnection();
        reject(new Error("ChainCast socket connection failed: " + error.message));
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
      console.log("ChainCast socket disconnected:", reason);
      this.cleanupConnection();

      // Handle reconnection manually with delay
      if (reason === "io server disconnect" || reason === "transport error") {
        this.scheduleReconnect();
      }
    });

    this.socket.on("error", (error) => {
      console.error("🚨 ChainCast socket error:", error);
      this.cleanupConnection();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isConnecting) {
      console.error("Max reconnection attempts reached or already connecting");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectSocket();
    }, delay);
  }

  private async reconnectSocket(): Promise<void> {
    console.log('Attempting to reconnect ChainCast socket...');

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
    console.log('Disconnecting ChainCast socket');
    this.cleanupSocket();
    this.cleanupConnection();
    this.reconnectAttempts = 0;
    this.currentToken = null;
    this.currentChainCastId = null;
  }

  // ChainCast room management
  async joinChainCast(chainCastId: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('Joining ChainCast:', chainCastId);
      this.currentChainCastId = chainCastId;
      this.socket.emit("join_chaincast", { chainCastId });
    } else {
      console.warn("Cannot join ChainCast - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  leaveChainCast(chainCastId: string): void {
    if (this.socket?.connected) {
      console.log('Leaving ChainCast:', chainCastId);
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
      console.log("📹 Updating stream:", data);
      this.socket.emit("stream_update", data);
    } else {
      console.warn("Cannot update stream - socket not connected");
    }
  }

  // Chat
  sendMessage(chainCastId: string, message: string): void {
    if (this.socket?.connected) {
      console.log('Sending message:', message);
      this.socket.emit("send_message", { chainCastId, message });
    } else {
      console.warn("Cannot send message - socket not connected");
    }
  }

  // Reactions
  addReaction(chainCastId: string, emoji: string): void {
    if (this.socket?.connected) {
      console.log('Adding reaction:', emoji);
      this.socket.emit("add_reaction", { chainCastId, emoji });
    } else {
      console.warn("Cannot add reaction - socket not connected");
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
      console.log("🛡️ Requesting moderation:", data);
      this.socket.emit("request_moderation", data);
    } else {
      console.warn("Cannot request moderation - socket not connected");
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
      console.log("⚡ Performing admin action:", data);
      this.socket.emit("admin_action", data);
    } else {
      console.warn("Cannot perform admin action - socket not connected");
    }
  }

  // Event listeners
  onJoinedChainCast(callback: (data: { chainCastId: string; participantCount: number; userRole: string }) => void): void {
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

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.on("error", callback);
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
}

export const chainCastSocketService = new ChainCastSocketService();
export type { ChainCastReaction, ModerationRequest, ChatMessage };