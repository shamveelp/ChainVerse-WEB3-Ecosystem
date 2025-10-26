import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/user.models';
import CommunityAdminModel from '../models/communityAdmin.model';
import logger from '../utils/logger';
import container from '../core/di/container';
import { IUserCommunityChatService } from '../core/interfaces/services/community/IUserCommunityChatService';
import { ICommunityAdminCommunityService } from '../core/interfaces/services/communityAdmin/ICommunityAdminCommunityService';
import { TYPES } from '../core/types/types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  userType?: 'user' | 'communityAdmin';
  communityId?: string;
}

// Store socket mappings
const communitySocketMap = new Map<string, Set<string>>(); // communityId -> Set<socketId>
const socketCommunityMap = new Map<string, string>(); // socketId -> communityId
const userSocketMap = new Map<string, string>(); // userId -> socketId

export const setupCommunitySocketHandlers = (io: SocketIOServer) => {
  const communityNamespace = io.of('/community');
  
  // Authentication middleware
  communityNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      if (!token) {
        logger.warn('Community socket connection attempted without token', {
          socketId: socket.id
        });
        return next(new Error('No token provided'));
      }

      if (typeof token !== 'string' || token.split('.').length !== 3) {
        logger.warn('Community socket connection attempted with invalid token format', {
          socketId: socket.id
        });
        return next(new Error('Invalid token format'));
      }

      if (JwtService.isTokenExpired(token)) {
        logger.warn('Community socket connection attempted with expired token', {
          socketId: socket.id
        });
        return next(new Error('Access token expired'));
      }

      let decoded;
      try {
        decoded = JwtService.verifySocketToken(token) as { id: string; role: string };
      } catch (verifyError: any) {
        logger.warn('Community socket token verification failed', {
          socketId: socket.id,
          error: verifyError.message
        });
        return next(new Error('Token verification failed'));
      }

      if (!decoded || !decoded.id) {
        logger.warn('Community socket connection attempted with invalid token payload', {
          socketId: socket.id
        });
        return next(new Error('Invalid token payload'));
      }

      // Check if user or community admin
      let user = null;
      let communityAdmin = null;
      
      if (decoded.role === 'communityAdmin') {
        communityAdmin = await CommunityAdminModel.findById(decoded.id)
          .select('_id name email communityId isActive')
          .lean()
          .exec();
        
        if (!communityAdmin || !communityAdmin.isActive) {
          return next(new Error('Community admin not found or inactive'));
        }
        
        socket.userId = communityAdmin._id.toString();
        socket.username = communityAdmin.name;
        socket.userType = 'communityAdmin';
        socket.communityId = communityAdmin.communityId.toString();
      } else {
        user = await UserModel.findById(decoded.id)
          .select('_id username name isBlocked isBanned')
          .lean()
          .exec();
        
        if (!user) {
          return next(new Error('User not found'));
        }

        if (user.isBlocked || user.isBanned) {
          return next(new Error('User account is suspended'));
        }

        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.userType = 'user';
      }

      logger.info('Community socket authentication successful', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        communityId: socket.communityId
      });
      next();
    } catch (error: any) {
      logger.error('Community socket authentication error', {
        socketId: socket.id,
        error: error.message
      });
      next(new Error('Authentication failed'));
    }
  });

  communityNamespace.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    logger.info('User connected to community socket', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      userType: socket.userType,
      communityId: socket.communityId
    });

    // Store user socket mapping
    userSocketMap.set(socket.userId, socket.id);

    // Auto-join admin to their community
    if (socket.userType === 'communityAdmin' && socket.communityId) {
      const communityRoom = `community:${socket.communityId}`;
      const channelRoom = `community:${socket.communityId}:channel`;
      const chatRoom = `community:${socket.communityId}:chat`;

      socket.join([communityRoom, channelRoom, chatRoom]);

      // Track community connections
      if (!communitySocketMap.has(socket.communityId)) {
        communitySocketMap.set(socket.communityId, new Set());
      }
      communitySocketMap.get(socket.communityId)!.add(socket.id);
      socketCommunityMap.set(socket.id, socket.communityId);

      logger.info('Admin auto-joined community rooms', {
        socketId: socket.id,
        userId: socket.userId,
        communityId: socket.communityId
      });
    }

    // Join community rooms (for users)
    socket.on('join_community', (data: { communityId: string }) => {
      if (!data.communityId) {
        socket.emit('error', { message: 'Community ID is required' });
        return;
      }

      const communityRoom = `community:${data.communityId}`;
      const channelRoom = `community:${data.communityId}:channel`;
      const chatRoom = `community:${data.communityId}:chat`;

      socket.join([communityRoom, channelRoom, chatRoom]);

      // Track community connections
      if (!communitySocketMap.has(data.communityId)) {
        communitySocketMap.set(data.communityId, new Set());
      }
      communitySocketMap.get(data.communityId)!.add(socket.id);
      socketCommunityMap.set(socket.id, data.communityId);

      logger.info('User joined community rooms', {
        socketId: socket.id,
        userId: socket.userId,
        communityId: data.communityId
      });

      socket.emit('joined_community', { communityId: data.communityId });
    });

    // Leave community rooms
    socket.on('leave_community', (data: { communityId: string }) => {
      if (!data.communityId) {
        socket.emit('error', { message: 'Community ID is required' });
        return;
      }

      const communityRoom = `community:${data.communityId}`;
      const channelRoom = `community:${data.communityId}:channel`;
      const chatRoom = `community:${data.communityId}:chat`;

      socket.leave(communityRoom);
      socket.leave(channelRoom);
      socket.leave(chatRoom);

      // Remove from tracking
      communitySocketMap.get(data.communityId)?.delete(socket.id);
      if (communitySocketMap.get(data.communityId)?.size === 0) {
        communitySocketMap.delete(data.communityId);
      }
      socketCommunityMap.delete(socket.id);

      logger.info('User left community rooms', {
        socketId: socket.id,
        userId: socket.userId,
        communityId: data.communityId
      });

      socket.emit('left_community', { communityId: data.communityId });
    });

    // Admin send message to community channel
    socket.on('send_channel_message', async (data: {
      content: string;
      mediaFiles?: any[];
      messageType?: 'text' | 'media' | 'mixed';
    }) => {
      try {
        if (socket.userType !== 'communityAdmin') {
          socket.emit('message_error', { error: 'Only admins can send channel messages' });
          return;
        }

        if (!data.content?.trim() && (!data.mediaFiles || data.mediaFiles.length === 0)) {
          socket.emit('message_error', { error: 'Message content or media is required' });
          return;
        }

        const communityService = container.get<ICommunityAdminCommunityService>(TYPES.ICommunityAdminCommunityService);
        const message = await communityService.sendMessage(socket.userId!, {
          content: data.content?.trim() || '',
          mediaFiles: data.mediaFiles || [],
          messageType: data.messageType
        });

        const channelRoom = `community:${socket.communityId}:channel`;
        
        // Emit to all community members in channel room (including the admin)
        communityNamespace.to(channelRoom).emit('new_channel_message', {
          message
        });

        logger.info('Channel message sent successfully', {
          socketId: socket.id,
          userId: socket.userId,
          communityId: socket.communityId,
          messageId: message._id
        });

      } catch (error: any) {
        logger.error('Send channel message error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('message_error', { error: error.message || 'Failed to send message' });
      }
    });

    // User react to channel message
    socket.on('react_to_channel_message', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        if (!data.messageId || !data.emoji) {
          socket.emit('reaction_error', { error: 'Message ID and emoji are required' });
          return;
        }

        const chatService = container.get<IUserCommunityChatService>(TYPES.IUserCommunityChatService);
        const result = await chatService.reactToMessage(socket.userId!, data.messageId, data.emoji);

        // Find which community this message belongs to
        const communityId = socketCommunityMap.get(socket.id);
        if (communityId) {
          const channelRoom = `community:${communityId}:channel`;
          communityNamespace.to(channelRoom).emit('message_reaction_updated', {
            messageId: data.messageId,
            reactions: result.reactions
          });
        }

        logger.info('Reaction added to channel message', {
          socketId: socket.id,
          userId: socket.userId,
          messageId: data.messageId,
          emoji: data.emoji
        });

      } catch (error: any) {
        logger.error('React to channel message error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('reaction_error', { error: error.message || 'Failed to add reaction' });
      }
    });

    // User send message to community group chat
    socket.on('send_group_message', async (data: {
      communityUsername: string;
      content: string;
    }) => {
      try {
        if (!data.communityUsername || !data.content?.trim()) {
          socket.emit('group_message_error', { error: 'Community username and content are required' });
          return;
        }

        const chatService = container.get<IUserCommunityChatService>(TYPES.IUserCommunityChatService);
        const message = await chatService.sendGroupMessage(socket.userId!, {
          communityUsername: data.communityUsername,
          content: data.content.trim()
        });

        const chatRoom = `community:${message.communityId}:chat`;
        
        // Emit to all community members in chat room (including admins)
        communityNamespace.to(chatRoom).emit('new_group_message', {
          message
        });

        logger.info('Group message sent successfully', {
          socketId: socket.id,
          userId: socket.userId,
          communityId: message.communityId,
          messageId: message._id
        });

      } catch (error: any) {
        logger.error('Send group message error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('group_message_error', { error: error.message || 'Failed to send message' });
      }
    });

    // User edit group message
    socket.on('edit_group_message', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        if (!data.messageId || !data.content?.trim()) {
          socket.emit('group_message_error', { error: 'Message ID and content are required' });
          return;
        }

        const chatService = container.get<IUserCommunityChatService>(TYPES.IUserCommunityChatService);
        const message = await chatService.editGroupMessage(socket.userId!, data.messageId, data.content.trim());

        const chatRoom = `community:${message.communityId}:chat`;
        
        // Emit to all community members in chat room
        communityNamespace.to(chatRoom).emit('group_message_edited', {
          message
        });

        logger.info('Group message edited successfully', {
          socketId: socket.id,
          userId: socket.userId,
          messageId: data.messageId
        });

      } catch (error: any) {
        logger.error('Edit group message error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('group_message_error', { error: error.message || 'Failed to edit message' });
      }
    });

    // User or Admin delete group message
    socket.on('delete_group_message', async (data: {
      messageId: string;
      communityId: string;
    }) => {
      try {
        if (!data.messageId) {
          socket.emit('group_message_error', { error: 'Message ID is required' });
          return;
        }

        const chatService = container.get<IUserCommunityChatService>(TYPES.IUserCommunityChatService);
        const result = await chatService.deleteGroupMessage(socket.userId!, data.messageId);

        if (data.communityId) {
          const chatRoom = `community:${data.communityId}:chat`;
          communityNamespace.to(chatRoom).emit('group_message_deleted', {
            messageId: data.messageId
          });
        }

        logger.info('Group message deleted successfully', {
          socketId: socket.id,
          userId: socket.userId,
          userType: socket.userType,
          messageId: data.messageId
        });

      } catch (error: any) {
        logger.error('Delete group message error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('group_message_error', { error: error.message || 'Failed to delete message' });
      }
    });

    // Admin delete any group message
    socket.on('admin_delete_group_message', async (data: {
      messageId: string;
      communityId: string;
    }) => {
      try {
        if (socket.userType !== 'communityAdmin') {
          socket.emit('group_message_error', { error: 'Only admins can delete any messages' });
          return;
        }

        if (!data.messageId) {
          socket.emit('group_message_error', { error: 'Message ID is required' });
          return;
        }

        // Admin can delete any message in their community
        // We'll need to add this service method
        const chatService = container.get<IUserCommunityChatService>(TYPES.IUserCommunityChatService);
        // For now, we'll use the same method but we should add admin-specific delete
        const result = await chatService.deleteGroupMessage(socket.userId!, data.messageId);

        if (data.communityId) {
          const chatRoom = `community:${data.communityId}:chat`;
          communityNamespace.to(chatRoom).emit('group_message_deleted', {
            messageId: data.messageId
          });
        }

        logger.info('Admin deleted group message successfully', {
          socketId: socket.id,
          adminId: socket.userId,
          messageId: data.messageId
        });

      } catch (error: any) {
        logger.error('Admin delete group message error', {
          socketId: socket.id,
          adminId: socket.userId,
          error: error.message
        });
        socket.emit('group_message_error', { error: error.message || 'Failed to delete message' });
      }
    });

    // Typing indicators for group chat
    socket.on('start_typing_group', (data: { communityId: string }) => {
      if (!data.communityId) {
        socket.emit('typing_error', { error: 'Community ID is required' });
        return;
      }

      const chatRoom = `community:${data.communityId}:chat`;
      socket.to(chatRoom).emit('user_typing_start_group', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType
      });
    });

    socket.on('stop_typing_group', (data: { communityId: string }) => {
      if (!data.communityId) {
        socket.emit('typing_error', { error: 'Community ID is required' });
        return;
      }

      const chatRoom = `community:${data.communityId}:chat`;
      socket.to(chatRoom).emit('user_typing_stop_group', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected from community socket', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        reason
      });

      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        
        // Clean up community connections
        const communityId = socketCommunityMap.get(socket.id);
        if (communityId) {
          communitySocketMap.get(communityId)?.delete(socket.id);
          if (communitySocketMap.get(communityId)?.size === 0) {
            communitySocketMap.delete(communityId);
          }
          socketCommunityMap.delete(socket.id);
        }
      }
    });

    socket.on('error', (error) => {
      logger.error('Community socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    });
  });

  return { communitySocketMap, userSocketMap };
};

// Helper function to emit to community
export const emitToCommunity = (io: SocketIOServer, communityId: string, event: string, data: any, room?: 'channel' | 'chat') => {
  const communityNamespace = io.of('/community');
  const roomName = room ? `community:${communityId}:${room}` : `community:${communityId}`;
  communityNamespace.to(roomName).emit(event, data);
};

// Helper function to check community connections
export const getCommunityConnections = (communityId: string): number => {
  return communitySocketMap.get(communityId)?.size || 0;
};