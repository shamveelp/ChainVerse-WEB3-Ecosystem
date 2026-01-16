import { io, Socket } from 'socket.io-client';
import axios from 'axios';

import {
  MessageData,
  EditMessageData,
  DeleteMessageData,
  TypingData,
  ReadMessagesData
} from "@/types/socket/chat.types";
import { store } from "@/redux/store";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  private async refreshToken(): Promise<string | null> {
    try {
      const state = store.getState();
      let refreshEndpoint: string;
      let actionType: string;

      // Determine endpoint based on which token is present or active role
      // This is a naive heuristic; usually you'd know who is logged in.
      // We check where the current token might have come from.
      if (state.communityAdminAuth?.token) {
        refreshEndpoint = "/api/community-admin/refresh-token";
        actionType = "communityAdminAuth/updateToken";
      } else if (state.adminAuth?.token) {
        refreshEndpoint = "/api/admin/refresh-token";
        actionType = "adminAuth/updateToken";
      } else {
        // Default to user - no Redux action needed for cookies
        refreshEndpoint = "/api/user/refresh-token";
        actionType = "";
      }

      // Use axios directly to avoid interceptor loop, but we need withCredentials
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${refreshEndpoint}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success && response.data.accessToken) {
        // Dispatch to Redux only if actionType is defined
        if (actionType) {
          store.dispatch({
            type: actionType,
            payload: response.data.accessToken,
          });
        }
        return response.data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Core socket token refresh failed:', error);
      return null;
    }
  }

  connect(token?: string): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      // If socket exists but is disconnected, we might be able to just reconnect
      // BUT we need to update the token if it changed.
      // So it is safer to destroy the old socket instance if we are doing a fresh connect with potential new credentials.
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: (cb) => {
          const state = store.getState();
          // Get the active token from the store, prioritizing specific auth slices
          const storedToken = state.communityAdminAuth?.token ||
            state.adminAuth?.token;

          // For user, storedToken is undefined. 
          // If a specific token was passed to connect(), use it.
          // Otherwise, if we just refreshed, the store might NOT be updated yet for non-redux users (cookies).
          // However, for sockets, we usually pass the token in auth object.
          // If cookie-based, the browser handles it, but our backend socket handler checks headers/auth token.

          const activeToken = storedToken || token?.trim();

          cb({
            token: activeToken
          });
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        withCredentials: true // Enable cookies
      });

      const timeout = setTimeout(() => {
        console.error('Socket connection timeout');
        reject(new Error('Socket connection timeout'));
      }, 15000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);

        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.connectionPromise = null;
        resolve();
      });

      this.socket.on('connect_error', async (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket connection error:', error.message);
        // Do NOT nullify connectionPromise yet if we are going to retry immediately via refresh

        // Check if it's an authentication error
        if (error.message?.includes('Authentication failed') ||
          error.message?.includes('No token provided') ||
          error.message?.includes('Access token expired') ||
          error.message?.includes('Token expired') ||
          error.message?.includes('Invalid token')) {

          console.warn('⚠️ Socket auth failed, attempting to refresh token...');

          try {
            // Attempt to refresh the token
            const newToken = await this.refreshToken();
            if (newToken) {
              console.log('✅ Token refreshed successfully for socket, retrying connection...');

              // We successfully refreshed. 
              // We need to update the socket's auth payload with the new token.
              // Since we defined auth as a callback, calling connect() *should* re-trigger it.
              // However, we want to ensure we don't infinitely loop if the new token also fails.
              // For simplicity, we just call connect() which triggers the auth callback we defined above.
              // The callback pulls from the store, and refreshToken() updated the store (for Redux) or cookies.

              // CRITICAL: For user (cookie-based), we need to ensure the callback picks up the new token if it's not in Redux.
              // But our callback logic uses `token` arg or Redux. 
              // Providing the newToken explicitly to the socket instance might be needed if the callback relies on the closure 'token' variable which is old.

              if (this.socket) {
                this.socket.auth = { token: newToken };
                this.socket.connect();
              }
              return; // Stay in the promise, wait for 'connect'
            }
          } catch (refreshError) {
            console.error('❌ Socket token refresh failed:', refreshError);
            this.connectionPromise = null;
            reject(new Error('Authentication failed - token expired and refresh failed'));
            return;
          }

          console.error('Authentication failed - check token validity');
          this.connectionPromise = null;
          reject(new Error('Authentication failed - token may be expired'));
        } else {
          // For non-auth errors, we let the default reconnect logic happen or fail
          // If we reject here, the caller sees an error.
          // Usually socket.io handles retries. 
          this.connectionPromise = null;
          this.handleReconnect();
          reject(error);
        }
      });

      this.setupEventListeners();
    });

    return this.connectionPromise;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {

      this.connectionPromise = null;

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', () => {

      this.reconnectAttempts = 0;
      this.connectionPromise = null;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
      this.connectionPromise = null;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('💥 Failed to reconnect to socket server after maximum attempts');
      this.connectionPromise = null;
    });

    // Add error handler for general socket errors
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);



    this.reconnectTimeout = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {

      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    this.connectionPromise = null;
  }

  // Room management
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {

      this.socket.emit('join_conversation', conversationId);
    } else {
      console.warn('Cannot join conversation - socket not connected');
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {

      this.socket.emit('leave_conversation', conversationId);
    } else {
      console.warn('Cannot leave conversation - socket not connected');
    }
  }

  // Message operations
  sendMessage(data: MessageData): void {
    if (this.socket?.connected) {

      this.socket.emit('send_message', data);
    } else {
      console.warn('Cannot send message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  editMessage(data: EditMessageData): void {
    if (this.socket?.connected) {

      this.socket.emit('edit_message', data);
    } else {
      console.warn('Cannot edit message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  deleteMessage(data: DeleteMessageData): void {
    if (this.socket?.connected) {

      this.socket.emit('delete_message', data);
    } else {
      console.warn('Cannot delete message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  markMessagesAsRead(data: ReadMessagesData): void {
    if (this.socket?.connected) {

      this.socket.emit('mark_messages_read', data);
    } else {
      console.warn('Cannot mark messages as read - socket not connected');
    }
  }

  // Typing indicators
  startTyping(data: TypingData): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', data);
    }
  }

  stopTyping(data: TypingData): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', data);
    }
  }

  // Event listeners
  onNewMessage(callback: (data: unknown) => void): void {
    this.socket?.on('new_message', callback);
  }

  onMessageSent(callback: (data: unknown) => void): void {
    this.socket?.on('message_sent', callback);
  }

  onMessageEdited(callback: (data: unknown) => void): void {
    this.socket?.on('message_edited', callback);
  }

  onMessageDeleted(callback: (data: unknown) => void): void {
    this.socket?.on('message_deleted', callback);
  }

  onMessagesRead(callback: (data: unknown) => void): void {
    this.socket?.on('messages_read', callback);
  }

  onConversationUpdated(callback: (data: unknown) => void): void {
    this.socket?.on('conversation_updated', callback);
  }

  onUserTypingStart(callback: (data: unknown) => void): void {
    this.socket?.on('user_typing_start', callback);
  }

  onUserTypingStop(callback: (data: unknown) => void): void {
    this.socket?.on('user_typing_stop', callback);
  }

  onUserStatusChanged(callback: (data: unknown) => void): void {
    this.socket?.on('user_status_changed', callback);
  }

  onMessageError(callback: (data: unknown) => void): void {
    this.socket?.on('message_error', callback);
  }

  onConversationError(callback: (data: unknown) => void): void {
    this.socket?.on('conversation_error', callback);
  }

  onTypingError(callback: (data: unknown) => void): void {
    this.socket?.on('typing_error', callback);
  }

  // Remove specific event listeners
  offNewMessage(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('new_message', callback);
      } else {
        this.socket.removeAllListeners('new_message');
      }
    }
  }

  offMessageSent(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('message_sent', callback);
      } else {
        this.socket.removeAllListeners('message_sent');
      }
    }
  }

  offMessageEdited(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('message_edited', callback);
      } else {
        this.socket.removeAllListeners('message_edited');
      }
    }
  }

  offMessageDeleted(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('message_deleted', callback);
      } else {
        this.socket.removeAllListeners('message_deleted');
      }
    }
  }

  offMessagesRead(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('messages_read', callback);
      } else {
        this.socket.removeAllListeners('messages_read');
      }
    }
  }

  offConversationUpdated(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('conversation_updated', callback);
      } else {
        this.socket.removeAllListeners('conversation_updated');
      }
    }
  }

  offUserTypingStart(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('user_typing_start', callback);
      } else {
        this.socket.removeAllListeners('user_typing_start');
      }
    }
  }

  offUserTypingStop(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('user_typing_stop', callback);
      } else {
        this.socket.removeAllListeners('user_typing_stop');
      }
    }
  }

  offUserStatusChanged(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('user_status_changed', callback);
      } else {
        this.socket.removeAllListeners('user_status_changed');
      }
    }
  }

  offMessageError(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('message_error', callback);
      } else {
        this.socket.removeAllListeners('message_error');
      }
    }
  }

  offConversationError(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('conversation_error', callback);
      } else {
        this.socket.removeAllListeners('conversation_error');
      }
    }
  }

  offTypingError(callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('typing_error', callback);
      } else {
        this.socket.removeAllListeners('typing_error');
      }
    }
  }

  // Generic event listeners
  on(event: string, callback: (data: unknown) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
