import { io, Socket } from "socket.io-client";

interface CommunityMessage {
  _id: string;
  communityId: string;
  admin: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  content: string;
  mediaFiles: {
    type: "image" | "video";
    url: string;
    filename: string;
  }[];
  messageType: "text" | "media" | "mixed";
  isPinned: boolean;
  reactions: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  totalReactions: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityGroupMessage {
  _id: string;
  communityId: string;
  sender: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
  };
  content: string;
  isEdited: boolean;
  editedAt?: Date;
  isCurrentUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SendChannelMessageData {
  content: string;
  mediaFiles?: any[];
  messageType?: "text" | "media" | "mixed";
}

interface SendGroupMessageData {
  communityUsername: string;
  content: string;
}

interface ReactionData {
  messageId: string;
  emoji: string;
}

interface TypingData {
  communityId: string;
}

class CommunitySocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private userType: 'user' | 'communityAdmin' | null = null;
  private communityId: string | null = null;

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
      console.warn("No valid token provided to community socket");
      return Promise.reject(new Error("No valid token provided"));
    }

    // If there's already a connection promise, return it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = `${apiUrl}/community`;

      console.log("Attempting to connect to community socket:", socketUrl);

      // Disconnect any existing socket first
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(socketUrl, {
        auth: {
          token: token.trim(),
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      const timeout = setTimeout(() => {
        console.error("Community socket connection timeout");
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error("Community socket connection timeout"));
      }, 15000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("✅ Connected to community socket", {
          socketId: this.socket?.id,
          transport: this.socket?.io.engine.transport.name
        });
        this.isConnecting = false;
        this.connectionPromise = null;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("❌ Community socket connection error:", {
          message: error.message,
          type: error,
          description: error.toString()
        });
        this.isConnecting = false;
        this.connectionPromise = null;

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

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from community socket:", reason);
      this.isConnecting = false;
      this.connectionPromise = null;

      if (reason === "io server disconnect") {
        // The disconnection was initiated by the server, reconnect manually
        setTimeout(() => this.reconnect(), 1000);
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected to community socket after", attemptNumber, "attempts");
      this.isConnecting = false;
      this.connectionPromise = null;
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Attempting to reconnect to community socket, attempt:", attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Community socket reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Community socket failed to reconnect after", this.maxReconnectAttempts, "attempts");
      this.isConnecting = false;
      this.connectionPromise = null;
    });

    this.socket.on("error", (error) => {
      console.error("🚨 Community socket error:", error);
    });
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isConnecting) {
      console.error("Max reconnection attempts reached or already connecting");
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting manual reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      this.socket?.connect();
    } catch (error) {
      console.error("Manual reconnection failed:", error);
      setTimeout(() => this.reconnect(), 2000 * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log("👋 Disconnecting from community socket");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.userType = null;
    this.communityId = null;
  }

  // Community management
  joinCommunity(communityId: string): void {
    if (this.socket?.connected) {
      console.log("🏠 Joining community:", communityId);
      this.communityId = communityId;
      this.socket.emit("join_community", { communityId });
    } else {
      console.warn("Cannot join community - socket not connected");
    }
  }

  leaveCommunity(communityId: string): void {
    if (this.socket?.connected) {
      console.log("🚪 Leaving community:", communityId);
      this.socket.emit("leave_community", { communityId });
      if (this.communityId === communityId) {
        this.communityId = null;
      }
    } else {
      console.warn("Cannot leave community - socket not connected");
    }
  }

  // Channel messages (Admin only)
  sendChannelMessage(data: SendChannelMessageData): void {
    if (this.socket?.connected) {
      console.log("📢 Sending channel message:", {
        contentLength: data.content?.length,
        hasMedia: !!data.mediaFiles?.length,
        messageType: data.messageType
      });
      this.socket.emit("send_channel_message", data);
    } else {
      console.warn("Cannot send channel message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  reactToChannelMessage(data: ReactionData): void {
    if (this.socket?.connected) {
      console.log("👍 Reacting to channel message:", data);
      this.socket.emit("react_to_channel_message", data);
    } else {
      console.warn("Cannot react to message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Group chat messages
  sendGroupMessage(data: SendGroupMessageData): void {
    if (this.socket?.connected) {
      console.log("💬 Sending group message:", {
        communityUsername: data.communityUsername,
        contentLength: data.content?.length
      });
      this.socket.emit("send_group_message", data);
    } else {
      console.warn("Cannot send group message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  editGroupMessage(messageId: string, content: string): void {
    if (this.socket?.connected) {
      console.log("✏️ Editing group message:", messageId);
      this.socket.emit("edit_group_message", { messageId, content });
    } else {
      console.warn("Cannot edit message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  deleteGroupMessage(messageId: string, communityId: string): void {
    if (this.socket?.connected) {
      console.log("🗑️ Deleting group message:", messageId);
      this.socket.emit("delete_group_message", { messageId, communityId });
    } else {
      console.warn("Cannot delete message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Admin delete group message
  adminDeleteGroupMessage(messageId: string, communityId: string): void {
    if (this.socket?.connected) {
      console.log("🗑️ Admin deleting group message:", messageId);
      this.socket.emit("admin_delete_group_message", { messageId, communityId });
    } else {
      console.warn("Cannot delete message - socket not connected");
      throw new Error("Socket not connected");
    }
  }

  // Typing indicators for group chat
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

  // Event listeners - Channel
  onJoinedCommunity(callback: (data: any) => void): void {
    this.socket?.on("joined_community", callback);
  }

  onLeftCommunity(callback: (data: any) => void): void {
    this.socket?.on("left_community", callback);
  }

  onNewChannelMessage(callback: (data: { message: CommunityMessage }) => void): void {
    this.socket?.on("new_channel_message", callback);
  }

  onChannelMessageSent(callback: (data: { message: CommunityMessage }) => void): void {
    this.socket?.on("channel_message_sent", callback);
  }

  onMessageReactionUpdated(callback: (data: { messageId: string; reactions: any[] }) => void): void {
    this.socket?.on("message_reaction_updated", callback);
  }

  onReactionAdded(callback: (data: { messageId: string; reactions: any[] }) => void): void {
    this.socket?.on("reaction_added", callback);
  }

  // Event listeners - Group Chat
  onNewGroupMessage(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("new_group_message", callback);
  }

  onGroupMessageSent(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("group_message_sent", callback);
  }

  onGroupMessageEdited(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("group_message_edited", callback);
  }

  onGroupMessageDeleted(callback: (data: { messageId: string }) => void): void {
    this.socket?.on("group_message_deleted", callback);
  }

  onGroupMessageEditSuccess(callback: (data: { message: CommunityGroupMessage }) => void): void {
    this.socket?.on("group_message_edit_success", callback);
  }

  onGroupMessageDeleteSuccess(callback: (data: { messageId: string }) => void): void {
    this.socket?.on("group_message_delete_success", callback);
  }

  // Typing indicators for group chat
  onUserTypingStartGroup(callback: (data: { userId: string; username: string; userType?: string }) => void): void {
    this.socket?.on("user_typing_start_group", callback);
  }

  onUserTypingStopGroup(callback: (data: { userId: string; username: string; userType?: string }) => void): void {
    this.socket?.on("user_typing_stop_group", callback);
  }

  // Error handlers
  onMessageError(callback: (data: { error: string }) => void): void {
    this.socket?.on("message_error", callback);
  }

  onGroupMessageError(callback: (data: { error: string }) => void): void {
    this.socket?.on("group_message_error", callback);
  }

  onReactionError(callback: (data: { error: string }) => void): void {
    this.socket?.on("reaction_error", callback);
  }

  onTypingError(callback: (data: { error: string }) => void): void {
    this.socket?.on("typing_error", callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.on("error", callback);
  }

  // Remove listeners
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

  getCurrentCommunityId(): string | null {
    return this.communityId;
  }
}

export const communitySocketService = new CommunitySocketService();
export type { CommunityMessage, CommunityGroupMessage };