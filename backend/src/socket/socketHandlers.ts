import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/user.models';
import logger from '../utils/logger';
import container from '../core/di/container';
import { IChatService } from '../core/interfaces/services/chat/IChat.service';
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
        logger.warn('Socket connection attempted without token', { 
          socketId: socket.id,
          headers: socket.handshake.headers,
          auth: socket.handshake.auth 
        });
        return next(new Error('No token provided'));
      }

      // Validate token format first
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        logger.warn('Socket connection attempted with invalid token format', { 
          socketId: socket.id,
          tokenType: typeof token,
          tokenLength: token.toString().length 
        });
        return next(new Error('Invalid token format'));
      }

      // Check if token is expired before verification
      if (JwtService.isTokenExpired(token)) {
        logger.warn('Socket connection attempted with expired token', { 
          socketId: socket.id 
        });
        return next(new Error('Access token expired'));
      }

      let decoded;
      try {
        decoded = JwtService.verifySocketToken(token) as { id: string; role: string };
      } catch (verifyError) {
        const error = verifyError as Error;
        logger.warn('Socket token verification failed', {
          socketId: socket.id,
          error: error.message,
          tokenPresent: !!token
        });
        
        if (error.message?.includes('expired')) {
          return next(new Error('Access token expired'));
        } else if (error.message?.includes('invalid')) {
          return next(new Error('Invalid token'));
        } else {
          return next(new Error('Token verification failed'));
        }
      }

      if (!decoded || !decoded.id) {
        logger.warn('Socket connection attempted with invalid token payload', { 
          socketId: socket.id,
          decoded: decoded ? 'present' : 'null' 
        });
        return next(new Error('Invalid token payload'));
      }

      // Verify user exists and is active
      let user;
      try {
        user = await UserModel.findById(decoded.id)
          .select('_id username isBlocked isBanned')
          .lean()
          .exec();
      } catch (dbError) {
        const error = dbError as Error;
        logger.error('Database error during socket authentication', {
          socketId: socket.id,
          userId: decoded.id,
          error: error.message
        });
        return next(new Error('Authentication failed'));
      }

      if (!user) {
        logger.warn('Socket connection attempted for non-existent user', { 
          socketId: socket.id,
          userId: decoded.id 
        });
        return next(new Error('User not found'));
      }

      if (user.isBlocked || user.isBanned) {
        logger.warn('Socket connection attempted for blocked/banned user', { 
          socketId: socket.id,
          userId: decoded.id,
          username: user.username,
          isBlocked: user.isBlocked,
          isBanned: user.isBanned 
        });
        return next(new Error('User account is suspended'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;

      logger.info('Socket authentication successful', {
        socketId: socket.id,
        userId: user._id,
        username: user.username
      });
      next();
    } catch (error) {
      let err = error as Error;
      logger.error('Socket authentication error', {
        socketId: socket.id,
        error: err.message,
        stack: err.stack,
        tokenPresent: !!socket.handshake.auth.token
      });

      if (err.message.includes('expired')) {
        next(new Error('Access token expired'));
      } else if (err.message.includes('invalid')) {
        next(new Error('Invalid token'));
      } else {
        next(new Error('Authentication failed'));
      }
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      logger.warn('Socket connected without userId, disconnecting', { 
        socketId: socket.id 
      });
      socket.disconnect(true);
      return;
    }

    logger.info('User connected to socket', { 
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username 
    });

    // Handle existing connection for the same user
    const existingSocketId = userSocketMap.get(socket.userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      // Disconnect the old socket
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        logger.info('Disconnecting existing socket for user', { 
          userId: socket.userId,
          username: socket.username,
          oldSocketId: existingSocketId,
          newSocketId: socket.id 
        });
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
        logger.warn('Invalid join_conversation request', { 
          socketId: socket.id,
          userId: socket.userId,
          conversationId 
        });
        socket.emit('conversation_error', { error: 'Invalid conversation ID' });
        return;
      }

      logger.info('User joining conversation', { 
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        conversationId 
      });
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      if (!conversationId || typeof conversationId !== 'string') {
        logger.warn('Invalid leave_conversation request', { 
          socketId: socket.id,
          userId: socket.userId,
          conversationId 
        });
        socket.emit('conversation_error', { error: 'Invalid conversation ID' });
        return;
      }

      logger.info('User leaving conversation', { 
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        conversationId 
      });
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
          logger.warn('Invalid send_message data', { 
            socketId: socket.id,
            userId: socket.userId,
            data 
          });
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
          logger.error('Send message failed - no conversation', { 
            socketId: socket.id,
            userId: socket.userId,
            receiverUsername: data.receiverUsername 
          });
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
          logger.error('Send message failed - invalid participants', { 
            socketId: socket.id,
            userId: socket.userId,
            conversationId: result.conversation._id 
          });
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

        logger.info('Message sent successfully', { 
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          receiverUsername: data.receiverUsername,
          conversationId: result.conversation._id,
          // messageId: result.message._id 
        });

      } catch (error) {
        const err = error as Error;
        logger.error('Socket send message error', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          receiverUsername: data.receiverUsername,
          error: err.message,
          stack: err.stack
        });

        socket.emit('message_error', {
          error: err.message || 'Failed to send message'
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
          logger.warn('Invalid edit_message data', { 
            socketId: socket.id,
            userId: socket.userId,
            data 
          });
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

        logger.info('Message edited successfully', { 
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          messageId: data.messageId,
          conversationId: data.conversationId 
        });

      } catch (error) {
        const err = error as Error;
        logger.error('Socket edit message error', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          messageId: data.messageId,
          error: err.message,
          stack: err.stack
        });

        socket.emit('message_error', {
          error: err.message || 'Failed to edit message'
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
          logger.warn('Invalid delete_message data', { 
            socketId: socket.id,
            userId: socket.userId,
            data 
          });
          socket.emit('message_error', { error: 'Invalid delete data' });
          return;
        }

        const chatService = container.get<IChatService>(TYPES.IChatService);
        await chatService.deleteMessage(data.messageId, socket.userId!);

        // Emit to conversation room
        io.to(`conversation:${data.conversationId}`).emit('message_deleted', {
          messageId: data.messageId
        });

        logger.info('Message deleted successfully', { 
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          messageId: data.messageId,
          conversationId: data.conversationId 
        });

      } catch (error) {
          const err = error as Error;
        logger.error('Socket delete message error', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          messageId: data.messageId,
          error: err.message,
          stack: err.stack
        });

        socket.emit('message_error', {
          error: err.message || 'Failed to delete message'
        });
      }
    });

    // Handle mark messages as read
    socket.on('mark_messages_read', async (data: {
      conversationId: string;
    }) => {
      try {
        if (!data.conversationId) {
          logger.warn('Invalid mark_messages_read data', { 
            socketId: socket.id,
            userId: socket.userId,
            data 
          });
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

        logger.info('Messages marked as read', { 
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          conversationId: data.conversationId 
        });

      } catch (error) {
        const err = error as Error;
        logger.error('Socket mark messages as read error', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          conversationId: data.conversationId,
          error: err.message,
          stack: err.stack
        });

        socket.emit('message_error', {
          error: err.message || 'Failed to mark messages as read'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (!data.conversationId) {
        logger.warn('Invalid typing_start data', { 
          socketId: socket.id,
          userId: socket.userId,
          data 
        });
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
        logger.warn('Invalid typing_stop data', { 
          socketId: socket.id,
          userId: socket.userId,
          data 
        });
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
      logger.info('User disconnected from socket', { 
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        reason 
      });

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
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        error: error.message,
        stack: error.stack
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