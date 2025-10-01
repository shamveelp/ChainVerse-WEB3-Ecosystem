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

    // Check if token is valid and not expired
    if (!token || this.isTokenExpired(token)) {
      console.warn('Invalid or expired token provided to socket');
      return Promise.reject(new Error('Invalid or expired token'));
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    console.log('Connecting to socket server...');
    
    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Connected to socket server:', this.socket?.id);
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
        console.error('Socket connection error:', error);
        this.connectionPromise = null;
        
        // Check if it's an authentication error
        if (error.message?.includes('Authentication failed') || 
            error.message?.includes('No token provided') ||
            error.message?.includes('Token expired')) {
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

  private isTokenExpired(token: string): boolean {
    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Unable to parse token:', error);
      return true; // Assume expired if can't parse
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.connectionPromise = null;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', () => {
      console.log('Successfully reconnected to socket server');
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      this.connectionPromise = null;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to socket server after maximum attempts');
      this.connectionPromise = null;
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from socket server...');
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
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  // Message operations
  sendMessage(data: MessageData): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    }
  }

  editMessage(data: EditMessageData): void {
    if (this.socket?.connected) {
      this.socket.emit('edit_message', data);
    }
  }

  deleteMessage(data: DeleteMessageData): void {
    if (this.socket?.connected) {
      this.socket.emit('delete_message', data);
    }
  }

  markMessagesAsRead(data: ReadMessagesData): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', data);
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
    this.socket?.on('new_message', callback);
  }

  onMessageSent(callback: (data: any) => void): void {
    this.socket?.on('message_sent', callback);
  }

  onMessageEdited(callback: (data: any) => void): void {
    this.socket?.on('message_edited', callback);
  }

  onMessageDeleted(callback: (data: any) => void): void {
    this.socket?.on('message_deleted', callback);
  }

  onMessagesRead(callback: (data: any) => void): void {
    this.socket?.on('messages_read', callback);
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
    this.socket?.on('user_status_changed', callback);
  }

  onMessageError(callback: (data: any) => void): void {
    this.socket?.on('message_error', callback);
  }

  onConversationError(callback: (data: any) => void): void {
    this.socket?.on('conversation_error', callback);
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

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();