import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/user.models';
import CommunityAdminModel from '../models/communityAdmin.model';
import logger from '../utils/logger';


interface AuthenticatedChainCastSocket extends Socket {
  userId?: string;
  username?: string;
  userType?: 'user' | 'communityAdmin';
  communityId?: string;
  chainCastId?: string;
}

// Store socket mappings for ChainCast
const chainCastSocketMap = new Map<string, Set<string>>(); // chainCastId -> Set<socketId>
const socketChainCastMap = new Map<string, string>(); // socketId -> chainCastId
const participantSocketMap = new Map<string, string>(); // participantId -> socketId
const socketUserMap = new Map<string, { userId: string; username: string; userType: string }>(); // socketId -> user info

export const setupChainCastSocketHandlers = (io: SocketIOServer) => {
  const chainCastNamespace = io.of('/chaincast');

  // Simplified authentication middleware
  chainCastNamespace.use(async (socket: AuthenticatedChainCastSocket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      if (!token) {
        logger.warn('ChainCast socket: No token provided', { socketId: socket.id });
        return next(new Error('No token provided'));
      }

      // Simplified token verification
      let decoded;
      try {
        decoded = JwtService.verifyToken(token) as { id: string; role: string };
      } catch (error) {
        // Try as socket token for backward compatibility
        try {
          decoded = JwtService.verifySocketToken(token) as { id: string; role: string };
        } catch (socketError) {
          logger.warn('ChainCast socket: Token verification failed', { socketId: socket.id });
          return next(new Error('Authentication failed'));
        }
      }

      if (!decoded?.id) {
        return next(new Error('Invalid token'));
      }

      // Simplified user lookup
      let userInfo = null;
      if (decoded.role === 'communityAdmin') {
        const admin = await CommunityAdminModel.findById(decoded.id).select('_id name communityId').lean();
        if (admin) {
          socket.userId = admin._id.toString();
          socket.username = admin.name;
          socket.userType = 'communityAdmin';
          socket.communityId = admin.communityId?.toString();
          userInfo = { userId: socket.userId, username: socket.username, userType: 'communityAdmin' };
        }
      } else {
        const user = await UserModel.findById(decoded.id).select('_id username name').lean();
        if (user) {
          socket.userId = user._id.toString();
          socket.username = user.username || user.name;
          socket.userType = 'user';
          userInfo = { userId: socket.userId, username: socket.username, userType: 'user' };
        }
      }

      if (!userInfo) {
        return next(new Error('User not found'));
      }

      socketUserMap.set(socket.id, userInfo);
      logger.info('ChainCast socket authenticated', {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType
      });
      next();
    } catch (error) {
      const err = error as Error;
      logger.error('ChainCast socket auth error', { error: err.message });
      next(new Error('Authentication failed'));
    }
  });

  chainCastNamespace.on('connection', (socket: AuthenticatedChainCastSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    logger.info('ChainCast socket connected', {
      socketId: socket.id,
      userId: socket.userId,
      userType: socket.userType
    });

    // Store participant socket mapping
    participantSocketMap.set(socket.userId, socket.id);

    // Join ChainCast room
    socket.on('join_chaincast', async (data: { chainCastId: string }) => {
      try {
        if (!data.chainCastId) {
          socket.emit('join_error', { error: 'ChainCast ID is required' });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;
        socket.join(chainCastRoom);
        socket.chainCastId = data.chainCastId;

        // Track ChainCast connections
        if (!chainCastSocketMap.has(data.chainCastId)) {
          chainCastSocketMap.set(data.chainCastId, new Set());
        }
        chainCastSocketMap.get(data.chainCastId)!.add(socket.id);
        socketChainCastMap.set(socket.id, data.chainCastId);

        const participantCount = chainCastSocketMap.get(data.chainCastId)?.size || 0;

        // Notify others about new participant
        socket.to(chainCastRoom).emit('participant_joined', {
          userId: socket.userId,
          username: socket.username,
          userType: socket.userType,
          hasVideo: socket.userType === 'communityAdmin',
          hasAudio: true,
          isMuted: false,
          isVideoOff: socket.userType !== 'communityAdmin'
        });

        socket.emit('joined_chaincast', { 
          chainCastId: data.chainCastId,
          participantCount,
          userRole: socket.userType === 'communityAdmin' ? 'admin' : 'viewer'
        });

        logger.info('User joined ChainCast', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId,
          participantCount
        });

      } catch (error: any) {
        logger.error('Join ChainCast error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('join_error', { error: 'Failed to join ChainCast' });
      }
    });

    // Leave ChainCast room
    socket.on('leave_chaincast', (data: { chainCastId: string }) => {
      leaveChainCastRoom(socket, data.chainCastId);
    });

    // Handle stream updates
    socket.on('stream_update', (data: {
      chainCastId: string;
      hasVideo: boolean;
      hasAudio: boolean;
      isMuted: boolean;
      isVideoOff: boolean;
    }) => {
      if (!data.chainCastId || !socket.chainCastId || socket.chainCastId !== data.chainCastId) {
        socket.emit('stream_error', { error: 'Invalid ChainCast session' });
        return;
      }

      const chainCastRoom = `chaincast:${data.chainCastId}`;
      
      // Broadcast stream update to all participants
      socket.to(chainCastRoom).emit('participant_stream_update', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio,
        isMuted: data.isMuted,
        isVideoOff: data.isVideoOff
      });

      logger.info('Stream update broadcast', {
        socketId: socket.id,
        userId: socket.userId,
        chainCastId: data.chainCastId,
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio
      });
    });

    // Handle reactions
    socket.on('add_reaction', async (data: { chainCastId: string; emoji: string }) => {
      try {
        if (!data.chainCastId || !data.emoji || !socket.chainCastId || socket.chainCastId !== data.chainCastId) {
          socket.emit('reaction_error', { error: 'Invalid reaction data' });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;
        
        // Broadcast reaction to all participants
        chainCastNamespace.to(chainCastRoom).emit('new_reaction', {
          userId: socket.userId,
          username: socket.username,
          emoji: data.emoji,
          timestamp: new Date()
        });

        logger.info('Reaction added', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId,
          emoji: data.emoji
        });

      } catch (error: any) {
        logger.error('Add reaction error', { error: error.message });
        socket.emit('reaction_error', { error: 'Failed to add reaction' });
      }
    });

    // Handle moderation requests (for users)
    socket.on('request_moderation', async (data: {
      chainCastId: string;
      requestedPermissions: { video: boolean; audio: boolean };
      message?: string;
    }) => {
      try {
        if (socket.userType !== 'user') {
          socket.emit('moderation_error', { error: 'Only users can request moderation' });
          return;
        }

        if (!data.chainCastId || !socket.chainCastId || socket.chainCastId !== data.chainCastId) {
          socket.emit('moderation_error', { error: 'Invalid ChainCast session' });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;
        
        // Notify admins about moderation request
        socket.to(chainCastRoom).emit('moderation_request', {
          userId: socket.userId,
          username: socket.username,
          requestedPermissions: data.requestedPermissions,
          message: data.message,
          timestamp: new Date()
        });

        socket.emit('moderation_requested', { message: 'Moderation request sent to admin' });

        logger.info('Moderation requested', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId
        });

      } catch (error: any) {
        logger.error('Request moderation error', { error: error.message });
        socket.emit('moderation_error', { error: 'Failed to request moderation' });
      }
    });

    // Handle chat messages
    socket.on('send_message', (data: { chainCastId: string; message: string }) => {
      if (!data.chainCastId || !data.message?.trim() || !socket.chainCastId || socket.chainCastId !== data.chainCastId) {
        socket.emit('message_error', { error: 'Invalid message data' });
        return;
      }

      const chainCastRoom = `chaincast:${data.chainCastId}`;
      const messageId = `${Date.now()}-${socket.userId}-${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        id: messageId,
        userId: socket.userId,
        username: socket.username,
        message: data.message.trim(),
        timestamp: new Date()
      };

      // Emit to all participants including sender
      chainCastNamespace.to(chainCastRoom).emit('new_message', messageData);
      socket.emit('new_message', messageData);
      
      logger.info('Chat message sent', {
        socketId: socket.id,
        userId: socket.userId,
        chainCastId: data.chainCastId,
        messageId
      });
    });

    // Handle admin actions
    socket.on('admin_action', async (data: {
      action: 'start' | 'end' | 'remove_participant' | 'approve_moderation' | 'reject_moderation';
      chainCastId: string;
      targetUserId?: string;
      requestId?: string;
      reason?: string;
    }) => {
      try {
        if (socket.userType !== 'communityAdmin') {
          socket.emit('admin_error', { error: 'Only admins can perform this action' });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;

        switch (data.action) {
          case 'start':
            chainCastNamespace.to(chainCastRoom).emit('chaincast_started', {
              adminId: socket.userId,
              adminName: socket.username,
              timestamp: new Date()
            });
            break;

          case 'end':
            chainCastNamespace.to(chainCastRoom).emit('chaincast_ended', {
              adminId: socket.userId,
              adminName: socket.username,
              timestamp: new Date()
            });
            break;

          case 'remove_participant':
            if (data.targetUserId) {
              const targetSocket = participantSocketMap.get(data.targetUserId);
              if (targetSocket) {
                chainCastNamespace.to(targetSocket).emit('removed_from_chaincast', {
                  adminName: socket.username,
                  reason: data.reason,
                  timestamp: new Date()
                });
              }
            }
            break;

          case 'approve_moderation':
          case 'reject_moderation':
            chainCastNamespace.to(chainCastRoom).emit('moderation_reviewed', {
              requestId: data.requestId,
              status: data.action === 'approve_moderation' ? 'approved' : 'rejected',
              adminName: socket.username,
              timestamp: new Date()
            });
            break;
        }

        socket.emit('admin_action_success', { 
          action: data.action,
          message: `${data.action} completed successfully`
        });

      } catch (error: any) {
        logger.error('Admin action error', { error: error.message });
        socket.emit('admin_error', { error: 'Failed to perform admin action' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('ChainCast socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      });

      cleanup(socket);
    });

    socket.on('error', (error) => {
      logger.error('ChainCast socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    });
  });

  // Helper functions
  function leaveChainCastRoom(socket: AuthenticatedChainCastSocket, chainCastId: string) {
    const chainCastRoom = `chaincast:${chainCastId}`;
    socket.leave(chainCastRoom);

    // Notify others about participant leaving
    socket.to(chainCastRoom).emit('participant_left', {
      userId: socket.userId,
      username: socket.username,
      userType: socket.userType
    });

    // Remove from tracking
    chainCastSocketMap.get(chainCastId)?.delete(socket.id);
    if (chainCastSocketMap.get(chainCastId)?.size === 0) {
      chainCastSocketMap.delete(chainCastId);
    }
    socketChainCastMap.delete(socket.id);
    socket.chainCastId = undefined;

    const participantCount = chainCastSocketMap.get(chainCastId)?.size || 0;
    socket.emit('left_chaincast', { 
      chainCastId,
      participantCount
    });

    logger.info('User left ChainCast', {
      socketId: socket.id,
      userId: socket.userId,
      chainCastId,
      participantCount
    });
  }

  function cleanup(socket: AuthenticatedChainCastSocket) {
    if (socket.userId) {
      participantSocketMap.delete(socket.userId);
      socketUserMap.delete(socket.id);

      // Clean up ChainCast connections
      const chainCastId = socketChainCastMap.get(socket.id);
      if (chainCastId) {
        leaveChainCastRoom(socket, chainCastId);
      }
    }
  }

  return { chainCastSocketMap, participantSocketMap };
};

// Helper functions for external use
export const emitToChainCast = (io: SocketIOServer, chainCastId: string, event: string, data: any) => {
  const chainCastNamespace = io.of('/chaincast');
  const roomName = `chaincast:${chainCastId}`;
  chainCastNamespace.to(roomName).emit(event, data);
};

export const getChainCastConnections = (chainCastId: string): number => {
  return chainCastSocketMap.get(chainCastId)?.size || 0;
};

export const notifyParticipant = (io: SocketIOServer, userId: string, event: string, data: any) => {
  const chainCastNamespace = io.of('/chaincast');
  const socketId = participantSocketMap.get(userId);
  if (socketId) {
    chainCastNamespace.to(socketId).emit(event, data);
  }
};