import { io, Socket } from "socket.io-client";
import { store } from "@/redux/store";

import {
  CommunityMessage,
  CommunityGroupMessage
} from "@/types/community/chat.types";
import {
  SendChannelMessageData,
  SendGroupMessageData,
  ReactionData,
  TypingData
} from "@/types/socket/community.types";

class CommunitySocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private communityId: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentToken: string | null = null;
  private messageTimeouts = new Map<string, NodeJS.Timeout>();

  async connect(token?: string): Promise<void> {
    // For testing: allow connection without token
    const actualToken = token || this.getCurrentToken() || 'guest-token';

    // Prevent multiple simultaneous connections
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected with same token, return immediately
    if (this.socket?.connected && this.currentToken === actualToken) {
      return Promise.resolve();
    }

    this.currentToken = actualToken;
    this.isConnecting = true;
    this.clearAllTimeouts();

    this.connectionPromise = new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = `${apiUrl}/community`;

      console.log("🔌 Connecting to community socket:", {
        url: socketUrl,
        hasToken: !!actualToken,
        tokenLength: actualToken?.length
      });

      // Disconnect any existing socket first
      this.cleanupSocket();

      this.socket = io(socketUrl, {
        auth: (cb) => {
          const state = store.getState();
          const userToken = state?.userAuth?.token;
          const adminToken = state?.communityAdminAuth?.token;
          // Use token from store, or fallback to passed token (though passed token might be stale on reconnect)
          const activeToken = adminToken || userToken || actualToken;
          cb({
            token: activeToken
          });
        },
        transports: ["websocket", "polling"],
        timeout: 30000, // Increased timeout
        forceNew: true,
        autoConnect: true,
        reconnection: true, // Enable built-in reconnection since we now handle dynamic tokens
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        // More lenient connection options
        upgrade: true,
        rememberUpgrade: true,
      });

      const timeout = setTimeout(() => {
        console.warn("⚠️ Community socket connection timeout - continuing in offline mode");
        this.isConnecting = false;
        // Don't reject, allow app to continue
        resolve();
      }, 30000); // 30s timeout

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ Connected to community socket", {
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
        console.warn("⚠️ Community socket connection error (allowing fallback):", {
          message: error.message,
          type: error.toString()
        });

        // For testing: don't immediately reject, try to continue
        this.isConnecting = false;
        this.connectionPromise = null;

        // Still resolve for testing purposes
        resolve();
      });

      this.setupEventListeners();
    });

    try {
      await this.connectionPromise;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      // For testing: don't throw, just log
      console.warn("Connection failed, continuing in offline mode:", error);
    }
  }

  private clearAllTimeouts(): void {
    this.messageTimeouts.forEach(timeout => clearTimeout(timeout));
    this.messageTimeouts.clear();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearAllTimeouts();
  }

  private cleanupConnection(): void {
    this.isConnecting = false;
    this.connectionPromise = null;
    this.clearAllTimeouts();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Community socket disconnected:", reason);
      this.cleanupConnection();

      // Handle reconnection manually with delay - only for unexpected disconnects
      if (reason !== "io client disconnect" && this.currentToken) {
        this.scheduleReconnect();
      }
    });

    this.socket.on("error", (error) => {
      console.warn("⚠️ Community socket error (non-critical):", error);
      // Don't disconnect on error - just log it
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isConnecting) {
      console.warn("Max reconnection attempts reached or already connecting");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`⏰ Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.currentToken || undefined);
      } catch (error) {
        console.warn("Reconnection attempt failed:", error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private getCurrentToken(): string | null {
    try {
      const state = store.getState();
      const userToken = state?.userAuth?.token;
      const adminToken = state?.communityAdminAuth?.token;
      return adminToken || userToken || null;
    } catch (e) {
      console.warn("Could not get token from Redux store");
      return null;
    }
  }

  disconnect(): void {
    console.log("🔌 Disconnecting community socket");
    this.cleanupSocket();
    this.cleanupConnection();
    this.reconnectAttempts = 0;
    this.communityId = null;
    this.currentToken = null;
  }

  // Community management - More resilient
  joinCommunity(communityId: string): void {
    console.log("🏠 Joining community:", communityId);
    this.communityId = communityId;

    if (this.socket?.connected) {
      this.socket.emit("join_community", { communityId });
    } else {
      console.warn("Cannot join community - socket not connected, will join when connected");
      // Try to connect and then join
      this.connect().then(() => {
        if (this.socket?.connected) {
          this.socket.emit("join_community", { communityId });
        }
      }).catch(err => {
        console.warn("Failed to connect for community join:", err);
      });
    }
  }

  leaveCommunity(communityId: string): void {
    console.log("🚪 Leaving community:", communityId);

    if (this.socket?.connected) {
      this.socket.emit("leave_community", { communityId });
      if (this.communityId === communityId) {
        this.communityId = null;
      }
    } else {
      console.warn("Cannot leave community - socket not connected");
    }
  }

  // Channel messages (Admin only) - Improved with timeout handling
  sendChannelMessage(data: SendChannelMessageData): void {
    console.log("📢 Sending channel message:", {
      contentLength: data.content?.length,
      hasMedia: !!data.mediaFiles?.length,
      messageType: data.messageType
    });

    if (this.socket?.connected) {
      this.socket.emit("send_channel_message", data);

      // Set timeout for message confirmation
      const timeoutId = setTimeout(() => {
        console.warn("Channel message send timeout - continuing anyway");
      }, 10000);

      this.messageTimeouts.set(`channel_${Date.now()}`, timeoutId);
    } else {
      console.warn("Cannot send channel message - socket not connected");
      // For testing: don't throw error, just log
      console.log("Would send message:", data);
    }
  }

  reactToChannelMessage(data: ReactionData): void {
    console.log("👍 Reacting to channel message:", data.messageId, data.emoji);

    if (this.socket?.connected) {
      this.socket.emit("react_to_channel_message", data);
    } else {
      console.warn("Cannot react to message - socket not connected");
    }
  }

  // Group chat messages - Improved with timeout handling
  sendGroupMessage(data: SendGroupMessageData): void {
    console.log("💬 Sending group message:", {
      communityUsername: data.communityUsername,
      contentLength: data.content?.length
    });

    if (this.socket?.connected) {
      this.socket.emit("send_group_message", data);

      // Set timeout for message confirmation
      const timeoutId = setTimeout(() => {
        console.warn("Group message send timeout - continuing anyway");
      }, 10000);

      this.messageTimeouts.set(`group_${Date.now()}`, timeoutId);
    } else {
      console.warn("Cannot send group message - socket not connected");
      // For testing: don't throw error, just log
      console.log("Would send message:", data);
    }
  }

  editGroupMessage(messageId: string, content: string): void {
    console.log("✏️ Editing group message:", messageId);

    if (this.socket?.connected) {
      this.socket.emit("edit_group_message", { messageId, content });
    } else {
      console.warn("Cannot edit message - socket not connected");
    }
  }

  deleteGroupMessage(messageId: string, communityId: string): void {
    console.log("🗑️ Deleting group message:", messageId);

    if (this.socket?.connected) {
      this.socket.emit("delete_group_message", { messageId, communityId });
    } else {
      console.warn("Cannot delete message - socket not connected");
    }
  }

  adminDeleteGroupMessage(messageId: string, communityId: string): void {
    console.log("🗑️ Admin deleting group message:", messageId);

    if (this.socket?.connected) {
      this.socket.emit("admin_delete_group_message", { messageId, communityId });
    } else {
      console.warn("Cannot delete message - socket not connected");
    }
  }

  // Typing indicators for group chat - More resilient
  startTypingGroup(data: TypingData): void {
    if (this.socket?.connected) {
      this.socket.emit("start_typing_group", data);
    }
  }

  stopTypingGroup(data: TypingData): void {
    if (this.socket?.connected) {
      this.socket.emit("stop_typing_group", data);
    }
  }

  // Event listeners - Enhanced with better error handling
  onJoinedCommunity(callback: (data: any) => void): void {
    this.socket?.on("joined_community", callback);
  }

  onLeftCommunity(callback: (data: any) => void): void {
    this.socket?.on("left_community", callback);
  }

  onNewChannelMessage(callback: (data: { message: CommunityMessage }) => void): void {
    this.socket?.on("new_channel_message", (data) => {
      console.log("📨 New channel message received:", data.message._id);
      callback(data);
    });
  }

  onChannelMessageSent(callback: (data: { message: CommunityMessage }) => void): void {
    this.socket?.on("channel_message_sent", (data) => {
      console.log("✅ Channel message sent confirmed:", data.message._id);
      // Clear timeout
      this.messageTimeouts.forEach((timeout, key) => {
        if (key.startsWith('channel_')) {
          clearTimeout(timeout);
          this.messageTimeouts.delete(key);
        }
      });
      callback(data);
    });
  }

  onMessageReactionUpdated(callback: (data: { messageId: string; reactions: any[] }) => void): void {
    this.socket?.on("message_reaction_updated", (data) => {
      console.log("👍 Reaction updated:", data.messageId);
      callback(data);
    });
  }

  onNewGroupMessage(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("new_group_message", (data) => {
      console.log("💬 New group message received:", data.message._id);
      callback(data);
    });
  }

  onGroupMessageSent(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("group_message_sent", (data) => {
      console.log("✅ Group message sent confirmed:", data.message._id);
      // Clear timeout
      this.messageTimeouts.forEach((timeout, key) => {
        if (key.startsWith('group_')) {
          clearTimeout(timeout);
          this.messageTimeouts.delete(key);
        }
      });
      callback(data);
    });
  }

  onGroupMessageEdited(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("group_message_edited", callback);
  }

  onGroupMessageDeleted(callback: (data: { messageId: string }) => void): void {
    this.socket?.on("group_message_deleted", callback);
  }

  onUserTypingStartGroup(callback: (data: { userId: string; username: string; userType?: string }) => void): void {
    this.socket?.on("user_typing_start_group", callback);
  }

  onUserTypingStopGroup(callback: (data: { userId: string; username: string; userType?: string }) => void): void {
    this.socket?.on("user_typing_stop_group", callback);
  }

  // Error handlers - More lenient
  onMessageError(callback: (data: { error: string }) => void): void {
    this.socket?.on("message_error", (data) => {
      console.warn("💬 Message error:", data.error);
      callback(data);
    });
  }

  onGroupMessageError(callback: (data: { error: string }) => void): void {
    this.socket?.on("group_message_error", (data) => {
      console.warn("💬 Group message error:", data.error);
      callback(data);
    });
  }

  onReactionError(callback: (data: { error: string }) => void): void {
    this.socket?.on("reaction_error", (data) => {
      console.warn("👍 Reaction error:", data.error);
      callback(data);
    });
  }

  onTypingError(callback: (data: { error: string }) => void): void {
    this.socket?.on("typing_error", callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.on("error", (data) => {
      console.warn("⚠️ Socket error:", data.message);
      callback(data);
    });
  }

  // Remove listeners - More comprehensive cleanup
  offJoinedCommunity(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("joined_community", callback);
    } else {
      this.socket?.removeAllListeners("joined_community");
    }
  }

  offNewChannelMessage(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("new_channel_message", callback);
    } else {
      this.socket?.removeAllListeners("new_channel_message");
    }
  }

  offNewGroupMessage(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("new_group_message", callback);
    } else {
      this.socket?.removeAllListeners("new_group_message");
    }
  }

  offChannelMessageSent(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("channel_message_sent", callback);
    } else {
      this.socket?.removeAllListeners("channel_message_sent");
    }
  }

  offMessageError(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off("message_error", callback);
    } else {
      this.socket?.removeAllListeners("message_error");
    }
  }

  offGroupMessageSent(callback?: (data: { message: CommunityGroupMessage }) => void): void {
    if (callback) {
      this.socket?.off("group_message_sent", callback);
    } else {
      this.socket?.removeAllListeners("group_message_sent");
    }
  }

  offGroupMessageEdited(callback?: (data: { message: CommunityGroupMessage }) => void): void {
    if (callback) {
      this.socket?.off("group_message_edited", callback);
    } else {
      this.socket?.removeAllListeners("group_message_edited");
    }
  }

  offGroupMessageDeleted(callback?: (data: { messageId: string }) => void): void {
    if (callback) {
      this.socket?.off("group_message_deleted", callback);
    } else {
      this.socket?.removeAllListeners("group_message_deleted");
    }
  }

  offUserTypingStartGroup(callback?: (data: { userId: string; username: string }) => void): void {
    if (callback) {
      this.socket?.off("user_typing_start_group", callback);
    } else {
      this.socket?.removeAllListeners("user_typing_start_group");
    }
  }

  offUserTypingStopGroup(callback?: (data: { userId: string; username: string }) => void): void {
    if (callback) {
      this.socket?.off("user_typing_stop_group", callback);
    } else {
      this.socket?.removeAllListeners("user_typing_stop_group");
    }
  }

  offGroupMessageError(callback?: (data: { error: string }) => void): void {
    if (callback) {
      this.socket?.off("group_message_error", callback);
    } else {
      this.socket?.removeAllListeners("group_message_error");
    }
  }

  offMessageReactionUpdated(callback?: (data: { messageId: string; reactions: any[] }) => void): void {
    if (callback) {
      this.socket?.off("message_reaction_updated", callback);
    } else {
      this.socket?.removeAllListeners("message_reaction_updated");
    }
  }

  offReactionError(callback?: (data: { error: string }) => void): void {
    if (callback) {
      this.socket?.off("reaction_error", callback);
    } else {
      this.socket?.removeAllListeners("reaction_error");
    }
  }

  // Utility methods - Enhanced
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

  getCurrentCommunityId(): string | null {
    return this.communityId;
  }

  // Force reconnect method for debugging
  forceReconnect(): Promise<void> {
    console.log("🔄 Force reconnecting community socket");
    this.disconnect();
    return this.connect(this.currentToken || undefined);
  }
}

export const communitySocketService = new CommunitySocketService();
export type { CommunityMessage, CommunityGroupMessage } from "@/types/community/chat.types";