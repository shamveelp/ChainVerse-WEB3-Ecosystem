import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/user.models';
import logger from '../utils/logger';
import container from '../core/di/container';
import { IChatService } from '../core/interfaces/services/chat/IChatService';
import { TYPES } from '../core/types/types';
import { SendMessageResponseDto } from '../dtos/chat/Chat.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Store user socket mappings
const userSocketMap = new Map<string, string>(); // userId -> socketId
const socketUserMap = new Map<string, string>(); // socketId -> userId

export const setupSocketHandlers = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      if (!token) {
        logger.warn('Socket connection attempted without token');
        return next(new Error('No token provided'));
      }

      // Check if token is expired before verification
      if (JwtService.isTokenExpired(token)) {
        logger.warn('Socket connection attempted with expired token');
        return next(new Error('Access token expired'));
      }

      const decoded = JwtService.verifySocketToken(token) as { id: string; role: string };

      if (!decoded || !decoded.id) {
        logger.warn('Socket connection attempted with invalid token payload');
        return next(new Error('Invalid token payload'));
      }

      // Verify user exists and is active
      const user = await UserModel.findById(decoded.id)
        .select('_id username isBlocked isBanned')
        .lean()
        .exec();
        
      if (!user) {
        logger.warn(`Socket connection attempted for non-existent user: ${decoded.id}`);
        return next(new Error('User not found'));
      }

      if (user.isBlocked || user.isBanned) {
        logger.warn(`Socket connection attempted for blocked/banned user: ${decoded.id}`);
        return next(new Error('User account is suspended'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      
      logger.info(`Socket authentication successful for user: ${user.username} (${user._id})`);
      next();
    } catch (error: any) {
      logger.error('Socket authentication error:', {
        error: error.message,
        stack: error.stack,
        token: socket.handshake.auth.token ? 'present' : 'missing'
      });
      
      if (error.message.includes('expired')) {
        next(new Error('Access token expired'));
      } else if (error.message.includes('invalid')) {
        next(new Error('Invalid token'));
      } else {
        next(new Error('Authentication failed'));
      }
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      logger.warn('Socket connected without userId, disconnecting');
      socket.disconnect(true);
      return;
    }

    logger.info(`User ${socket.username} connected with socket ${socket.id}`);

    // Handle existing connection for the same user
    const existingSocketId = userSocketMap.get(socket.userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      // Disconnect the old socket
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        logger.info(`Disconnecting existing socket for user ${socket.username}`);
        existingSocket.disconnect(true);
      }
    }

    // Store user-socket mapping
    userSocketMap.set(socket.userId, socket.id);
    socketUserMap.set(socket.id, socket.userId);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Emit user online status
    socket.emit('user_online', { userId: socket.userId });
    socket.broadcast.emit('user_status_changed', {
      userId: socket.userId,
      isOnline: true
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      if (!conversationId || typeof conversationId !== 'string') {
        socket.emit('conversation_error', { error: 'Invalid conversation ID' });
        return;
      }

      logger.info(`User ${socket.username} joining conversation ${conversationId}`);
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      if (!conversationId || typeof conversationId !== 'string') {
        socket.emit('conversation_error', { error: 'Invalid conversation ID' });
        return;
      }

      logger.info(`User ${socket.username} leaving conversation ${conversationId}`);
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle send message
    socket.on('send_message', async (data: {
      receiverUsername: string;
      content: string;
      conversationId?: string;
    }) => {
      try {
        if (!data.receiverUsername || !data.content?.trim()) {
          socket.emit('message_error', { error: 'Invalid message data' });
          return;
        }

        const chatService = container.get<IChatService>(TYPES.IChatService);
        const result: SendMessageResponseDto = await chatService.sendMessage(
          socket.userId!,
          data.receiverUsername.trim(),
          data.content.trim()
        );

        // Check if conversation exists
        if (!result.conversation || !result.conversation._id) {
          socket.emit('message_error', { error: 'Conversation not found' });
          return;
        }

        // Join conversation room if not already joined
        const conversationRoom = `conversation:${result.conversation._id}`;
        socket.join(conversationRoom);

        // Emit to conversation room
        io.to(conversationRoom).emit('new_message', {
          message: result.message,
          conversation: result.conversation
        });

        // Notify receiver if online
        const participants = result.conversation.participants;
        if (!participants || participants.length < 1) {
          socket.emit('message_error', { error: 'Invalid conversation participants' });
          return;
        }

        const receiverUser = participants.find(p => p._id !== socket.userId);
        if (receiverUser && receiverUser._id) {
          const receiverSocketId = userSocketMap.get(receiverUser._id);
          if (receiverSocketId) {
            io.to(`user:${receiverUser._id}`).emit('conversation_updated', {
              conversation: result.conversation
            });
          }
        }

        // Confirm to sender
        socket.emit('message_sent', {
          message: result.message,
          conversation: result.conversation
        });

        logger.info(`Message sent from ${socket.username} to ${data.receiverUsername}`);

      } catch (error: any) {
        logger.error('Socket send message error:', {
          error: error.message,
          stack: error.stack,
          userId: socket.userId,
          receiverUsername: data.receiverUsername
        });
        
        socket.emit('message_error', {
          error: error.message || 'Failed to send message'
        });
      }
    });

    // Handle edit message
    socket.on('edit_message', async (data: {
      messageId: string;
      content: string;
      conversationId: string;
    }) => {
      try {
        if (!data.messageId || !data.content?.trim() || !data.conversationId) {
          socket.emit('message_error', { error: 'Invalid edit data' });
          return;
        }

        const chatService = container.get<IChatService>(TYPES.IChatService);
        const editedMessage = await chatService.editMessage(
          data.messageId,
          socket.userId!,
          data.content.trim()
        );

        // Emit to conversation room
        io.to(`conversation:${data.conversationId}`).emit('message_edited', {
          message: editedMessage
        });

        logger.info(`Message edited by ${socket.username}: ${data.messageId}`);

      } catch (error: any) {
        logger.error('Socket edit message error:', {
          error: error.message,
          stack: error.stack,
          userId: socket.userId,
          messageId: data.messageId
        });
        
        socket.emit('message_error', {
          error: error.message || 'Failed to edit message'
        });
      }
    });

    // Handle delete message
    socket.on('delete_message', async (data: {
      messageId: string;
      conversationId: string;
    }) => {
      try {
        if (!data.messageId || !data.conversationId) {
          socket.emit('message_error', { error: 'Invalid delete data' });
          return;
        }

        const chatService = container.get<IChatService>(TYPES.IChatService);
        await chatService.deleteMessage(data.messageId, socket.userId!);

        // Emit to conversation room
        io.to(`conversation:${data.conversationId}`).emit('message_deleted', {
          messageId: data.messageId
        });

        logger.info(`Message deleted by ${socket.username}: ${data.messageId}`);

      } catch (error: any) {
        logger.error('Socket delete message error:', {
          error: error.message,
          stack: error.stack,
          userId: socket.userId,
          messageId: data.messageId
        });
        
        socket.emit('message_error', {
          error: error.message || 'Failed to delete message'
        });
      }
    });

    // Handle mark messages as read
    socket.on('mark_messages_read', async (data: {
      conversationId: string;
    }) => {
      try {
        if (!data.conversationId) {
          socket.emit('message_error', { error: 'Invalid conversation ID' });
          return;
        }

        const chatService = container.get<IChatService>(TYPES.IChatService);
        await chatService.markMessagesAsRead(data.conversationId, socket.userId!);

        // Emit to conversation room
        io.to(`conversation:${data.conversationId}`).emit('messages_read', {
          userId: socket.userId,
          conversationId: data.conversationId,
          readAt: new Date()
        });

        logger.info(`Messages marked as read by ${socket.username} in conversation ${data.conversationId}`);

      } catch (error: any) {
        logger.error('Socket mark messages as read error:', {
          error: error.message,
          stack: error.stack,
          userId: socket.userId,
          conversationId: data.conversationId
        });
        
        socket.emit('message_error', {
          error: error.message || 'Failed to mark messages as read'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (!data.conversationId) {
        socket.emit('typing_error', { error: 'Invalid conversation ID' });
        return;
      }

      socket.to(`conversation:${data.conversationId}`).emit('user_typing_start', {
        userId: socket.userId,
        username: socket.username
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      if (!data.conversationId) {
        socket.emit('typing_error', { error: 'Invalid conversation ID' });
        return;
      }

      socket.to(`conversation:${data.conversationId}`).emit('user_typing_stop', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`User ${socket.username} disconnected: ${reason}`);

      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        socketUserMap.delete(socket.id);

        // Notify others that user is offline
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });

    // Handle socket errors
    socket.on('error', (error) => {
      logger.error('Socket error:', {
        error: error.message,
        stack: error.stack,
        userId: socket.userId,
        username: socket.username
      });
    });
  });

  return { userSocketMap, socketUserMap };
};

// Helper function to emit to user
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any) => {
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

// Helper function to check if user is online
export const isUserOnline = (userId: string): boolean => {
  return userSocketMap.has(userId);
};