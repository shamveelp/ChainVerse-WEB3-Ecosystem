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
  private isConnecting = false;
  private currentToken: string | null = null;
  private currentChainCastId: string | null = null;
  private eventListenersSetup = false;

  async connect(token: string): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      return;
    }

    // If already connected with same token, return
    if (this.socket?.connected && this.currentToken === token) {
      return Promise.resolve();
    }

    if (!token?.trim()) {
      throw new Error("No valid token provided");
    }

    this.currentToken = token;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = `${apiUrl}/chaincast`;

      console.log('Connecting to ChainCast socket:', socketUrl);

      // Clean up existing connection
      this.cleanup();

      this.socket = io(socketUrl, {
        auth: { token: token.trim() },
        transports: ["websocket", "polling"],
        timeout: 5000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      const timeout = setTimeout(() => {
        console.error("ChainCast socket connection timeout");
        this.cleanup();
        reject(new Error("Connection timeout"));
      }, 6000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ Connected to ChainCast socket", { socketId: this.socket?.id });
        this.isConnecting = false;
        this.setupEventListeners();
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("❌ ChainCast socket connection error:", error.message);
        this.cleanup();
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("ChainCast socket disconnected");
        this.eventListenersSetup = false;
      });
    });
  }

  private setupEventListeners(): void {
    if (!this.socket || this.eventListenersSetup) return;
    this.eventListenersSetup = true;

    this.socket.on("error", (error) => {
      console.error("ChainCast socket error:", error);
    });
  }

  private cleanup(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.eventListenersSetup = false;
  }

  disconnect(): void {
    console.log('Disconnecting ChainCast socket');
    this.cleanup();
    this.currentToken = null;
    this.currentChainCastId = null;
  }

  // ChainCast room management
  async joinChainCast(chainCastId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    console.log('Joining ChainCast:', chainCastId);
    this.currentChainCastId = chainCastId;
    this.socket.emit("join_chaincast", { chainCastId });
  }

  leaveChainCast(chainCastId: string): void {
    if (this.socket?.connected) {
      console.log('Leaving ChainCast:', chainCastId);
      this.socket.emit("leave_chaincast", { chainCastId });
      if (this.currentChainCastId === chainCastId) {
        this.currentChainCastId = null;
      }
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
    }
  }

  // Chat
  sendMessage(chainCastId: string, message: string): void {
    if (this.socket?.connected && message.trim()) {
      console.log('Sending message:', message);
      this.socket.emit("send_message", { chainCastId, message: message.trim() });
    }
  }

  // Reactions
  addReaction(chainCastId: string, emoji: string): void {
    if (this.socket?.connected) {
      console.log('Adding reaction:', emoji);
      this.socket.emit("add_reaction", { chainCastId, emoji });
    }
  }

  // Moderation
  requestModeration(data: {
    chainCastId: string;
    requestedPermissions: { video: boolean; audio: boolean };
    message?: string;
  }): void {
    if (this.socket?.connected) {
      console.log("🛡️ Requesting moderation:", data);
      this.socket.emit("request_moderation", data);
    }
  }

  // Event listeners - only set up once per connection
  onJoinedChainCast(callback: (data: { chainCastId: string; participantCount: number; userRole: string }) => void): void {
    this.socket?.off("joined_chaincast").on("joined_chaincast", callback);
  }

  onLeftChainCast(callback: (data: { chainCastId: string; participantCount: number }) => void): void {
    this.socket?.off("left_chaincast").on("left_chaincast", callback);
  }

  onParticipantJoined(callback: (participant: ChainCastParticipant) => void): void {
    this.socket?.off("participant_joined").on("participant_joined", callback);
  }

  onParticipantLeft(callback: (participant: ChainCastParticipant) => void): void {
    this.socket?.off("participant_left").on("participant_left", callback);
  }

  onParticipantStreamUpdate(callback: (data: ChainCastParticipant) => void): void {
    this.socket?.off("participant_stream_update").on("participant_stream_update", callback);
  }

  onNewMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.off("new_message").on("new_message", callback);
  }

  onNewReaction(callback: (reaction: ChainCastReaction) => void): void {
    this.socket?.off("new_reaction").on("new_reaction", callback);
  }

  onModerationRequested(callback: (data: { message: string }) => void): void {
    this.socket?.off("moderation_requested").on("moderation_requested", callback);
  }

  onModerationReviewed(callback: (data: {
    requestId: string;
    status: 'approved' | 'rejected';
    adminName: string;
    timestamp: Date;
  }) => void): void {
    this.socket?.off("moderation_reviewed").on("moderation_reviewed", callback);
  }

  onChainCastStarted(callback: (data: { adminId: string; adminName: string; timestamp: Date }) => void): void {
    this.socket?.off("chaincast_started").on("chaincast_started", callback);
  }

  onChainCastEnded(callback: (data: { adminId: string; adminName: string; timestamp: Date }) => void): void {
    this.socket?.off("chaincast_ended").on("chaincast_ended", callback);
  }

  onRemovedFromChainCast(callback: (data: { adminName: string; reason?: string; timestamp: Date }) => void): void {
    this.socket?.off("removed_from_chaincast").on("removed_from_chaincast", callback);
  }

  // Error handlers
  onJoinError(callback: (data: { error: string }) => void): void {
    this.socket?.off("join_error").on("join_error", callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.off("error").on("error", callback);
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
}

export const chainCastSocketService = new ChainCastSocketService();
export type { ChainCastReaction, ModerationRequest, ChatMessage };