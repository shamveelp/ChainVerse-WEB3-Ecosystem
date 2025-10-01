import { io, Socket } from 'socket.io-client';

interface MessageData {
  receiverUsername: string;
  content: string;
  conversationId?: string;
}

interface EditMessageData {
  messageId: string;
  content: string;
  conversationId: string;
}

interface DeleteMessageData {
  messageId: string;
  conversationId: string;
}

interface TypingData {
  conversationId: string;
}

interface ReadMessagesData {
  conversationId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    // Basic token validation - just check if it exists and is a string
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.warn('No valid token provided to socket');
      return Promise.reject(new Error('No valid token provided'));
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    console.log('Connecting to socket server with token...');
    
    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: {
          token: token.trim()
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true
      });

      const timeout = setTimeout(() => {
        console.error('Socket connection timeout');
        reject(new Error('Socket connection timeout'));
      }, 15000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to socket server:', this.socket?.id);
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.connectionPromise = null;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket connection error:', error.message);
        this.connectionPromise = null;
        
        // Check if it's an authentication error
        if (error.message?.includes('Authentication failed') || 
            error.message?.includes('No token provided') ||
            error.message?.includes('Token expired') ||
            error.message?.includes('Invalid token')) {
          console.error('Authentication failed - check token validity');
          reject(new Error('Authentication failed - token may be expired'));
        } else {
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
      console.log('🔌 Disconnected from socket server:', reason);
      this.connectionPromise = null;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Successfully reconnected to socket server');
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
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('👋 Disconnecting from socket server...');
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
      console.log('🏠 Joining conversation:', conversationId);
      this.socket.emit('join_conversation', conversationId);
    } else {
      console.warn('Cannot join conversation - socket not connected');
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      console.log('🚪 Leaving conversation:', conversationId);
      this.socket.emit('leave_conversation', conversationId);
    } else {
      console.warn('Cannot leave conversation - socket not connected');
    }
  }

  // Message operations
  sendMessage(data: MessageData): void {
    if (this.socket?.connected) {
      console.log('📤 Sending message via socket:', data);
      this.socket.emit('send_message', data);
    } else {
      console.warn('Cannot send message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  editMessage(data: EditMessageData): void {
    if (this.socket?.connected) {
      console.log('✏️ Editing message via socket:', data);
      this.socket.emit('edit_message', data);
    } else {
      console.warn('Cannot edit message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  deleteMessage(data: DeleteMessageData): void {
    if (this.socket?.connected) {
      console.log('🗑️ Deleting message via socket:', data);
      this.socket.emit('delete_message', data);
    } else {
      console.warn('Cannot delete message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  markMessagesAsRead(data: ReadMessagesData): void {
    if (this.socket?.connected) {
      console.log('📖 Marking messages as read via socket:', data);
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
  onNewMessage(callback: (data: any) => void): void {
    this.socket?.on('new_message', (data) => {
      console.log('📨 Received new message:', data);
      callback(data);
    });
  }

  onMessageSent(callback: (data: any) => void): void {
    this.socket?.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
      callback(data);
    });
  }

  onMessageEdited(callback: (data: any) => void): void {
    this.socket?.on('message_edited', (data) => {
      console.log('✏️ Message edited:', data);
      callback(data);
    });
  }

  onMessageDeleted(callback: (data: any) => void): void {
    this.socket?.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data);
      callback(data);
    });
  }

  onMessagesRead(callback: (data: any) => void): void {
    this.socket?.on('messages_read', (data) => {
      console.log('📖 Messages read:', data);
      callback(data);
    });
  }

  onConversationUpdated(callback: (data: any) => void): void {
    this.socket?.on('conversation_updated', callback);
  }

  onUserTypingStart(callback: (data: any) => void): void {
    this.socket?.on('user_typing_start', callback);
  }

  onUserTypingStop(callback: (data: any) => void): void {
    this.socket?.on('user_typing_stop', callback);
  }

  onUserStatusChanged(callback: (data: any) => void): void {
    this.socket?.on('user_status_changed', (data) => {
      console.log('👤 User status changed:', data);
      callback(data);
    });
  }

  onMessageError(callback: (data: any) => void): void {
    this.socket?.on('message_error', (data) => {
      console.error('❌ Message error:', data);
      callback(data);
    });
  }

  onConversationError(callback: (data: any) => void): void {
    this.socket?.on('conversation_error', (data) => {
      console.error('❌ Conversation error:', data);
      callback(data);
    });
  }

  onTypingError(callback: (data: any) => void): void {
    this.socket?.on('typing_error', callback);
  }

  // Remove specific event listeners
  offNewMessage(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('new_message', callback);
    } else {
      this.socket?.removeAllListeners('new_message');
    }
  }

  offMessageSent(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('message_sent', callback);
    } else {
      this.socket?.removeAllListeners('message_sent');
    }
  }

  offMessageEdited(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('message_edited', callback);
    } else {
      this.socket?.removeAllListeners('message_edited');
    }
  }

  offMessageDeleted(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('message_deleted', callback);
    } else {
      this.socket?.removeAllListeners('message_deleted');
    }
  }

  offMessagesRead(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('messages_read', callback);
    } else {
      this.socket?.removeAllListeners('messages_read');
    }
  }

  offConversationUpdated(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('conversation_updated', callback);
    } else {
      this.socket?.removeAllListeners('conversation_updated');
    }
  }

  offUserTypingStart(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('user_typing_start', callback);
    } else {
      this.socket?.removeAllListeners('user_typing_start');
    }
  }

  offUserTypingStop(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('user_typing_stop', callback);
    } else {
      this.socket?.removeAllListeners('user_typing_stop');
    }
  }

  offUserStatusChanged(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('user_status_changed', callback);
    } else {
      this.socket?.removeAllListeners('user_status_changed');
    }
  }

  offMessageError(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('message_error', callback);
    } else {
      this.socket?.removeAllListeners('message_error');
    }
  }

  offConversationError(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('conversation_error', callback);
    } else {
      this.socket?.removeAllListeners('conversation_error');
    }
  }

  offTypingError(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('typing_error', callback);
    } else {
      this.socket?.removeAllListeners('typing_error');
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