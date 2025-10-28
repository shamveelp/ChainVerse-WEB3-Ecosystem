import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/user.models';
import CommunityAdminModel from '../models/communityAdmin.model';
import logger from '../utils/logger';
import container from '../core/di/container';
import { IChainCastService } from '../core/interfaces/services/chainCast/IChainCastService';
import { TYPES } from '../core/types/types';

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

export const setupChainCastSocketHandlers = (io: SocketIOServer) => {
  const chainCastNamespace = io.of('/chaincast');

  // Authentication middleware
  chainCastNamespace.use(async (socket: AuthenticatedChainCastSocket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      if (!token) {
        logger.warn('ChainCast socket connection attempted without token', {
          socketId: socket.id
        });
        return next(new Error('No token provided'));
      }

      if (typeof token !== 'string' || token.split('.').length !== 3) {
        logger.warn('ChainCast socket connection attempted with invalid token format', {
          socketId: socket.id
        });
        return next(new Error('Invalid token format'));
      }

      if (JwtService.isTokenExpired(token)) {
        logger.warn('ChainCast socket connection attempted with expired token', {
          socketId: socket.id
        });
        return next(new Error('Access token expired'));
      }

      let decoded;
      try {
        decoded = JwtService.verifySocketToken(token) as { id: string; role: string };
      } catch (verifyError: any) {
        logger.warn('ChainCast socket token verification failed', {
          socketId: socket.id,
          error: verifyError.message
        });
        return next(new Error('Token verification failed'));
      }

      if (!decoded || !decoded.id) {
        logger.warn('ChainCast socket connection attempted with invalid token payload', {
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

      logger.info('ChainCast socket authentication successful', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        communityId: socket.communityId
      });
      next();
    } catch (error: any) {
      logger.error('ChainCast socket authentication error', {
        socketId: socket.id,
        error: error.message
      });
      next(new Error('Authentication failed'));
    }
  });

  chainCastNamespace.on('connection', (socket: AuthenticatedChainCastSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    logger.info('User connected to ChainCast socket', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      userType: socket.userType
    });

    // Store participant socket mapping
    participantSocketMap.set(socket.userId, socket.id);

    // Join ChainCast room
    socket.on('join_chaincast', async (data: { chainCastId: string }) => {
      try {
        if (!data.chainCastId) {
          socket.emit('error', { message: 'ChainCast ID is required' });
          return;
        }

        const chainCastService = container.get<IChainCastService>(TYPES.IChainCastService);
        
        // Verify user can join this ChainCast
        const { canJoin, reason } = await chainCastService.canUserJoinChainCast(socket.userId!, data.chainCastId);
        if (!canJoin) {
          socket.emit('join_error', { error: reason || 'Cannot join ChainCast' });
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

        // Notify others about new participant
        socket.to(chainCastRoom).emit('participant_joined', {
          userId: socket.userId,
          username: socket.username,
          userType: socket.userType
        });

        socket.emit('joined_chaincast', { 
          chainCastId: data.chainCastId,
          participantCount: chainCastSocketMap.get(data.chainCastId)?.size || 0
        });

        logger.info('User joined ChainCast room', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId
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
      if (!data.chainCastId) {
        socket.emit('error', { message: 'ChainCast ID is required' });
        return;
      }

      const chainCastRoom = `chaincast:${data.chainCastId}`;
      socket.leave(chainCastRoom);

      // Notify others about participant leaving
      socket.to(chainCastRoom).emit('participant_left', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType
      });

      // Remove from tracking
      chainCastSocketMap.get(data.chainCastId)?.delete(socket.id);
      if (chainCastSocketMap.get(data.chainCastId)?.size === 0) {
        chainCastSocketMap.delete(data.chainCastId);
      }
      socketChainCastMap.delete(socket.id);
      socket.chainCastId = undefined;

      socket.emit('left_chaincast', { 
        chainCastId: data.chainCastId,
        participantCount: chainCastSocketMap.get(data.chainCastId)?.size || 0
      });

      logger.info('User left ChainCast room', {
        socketId: socket.id,
        userId: socket.userId,
        chainCastId: data.chainCastId
      });
    });

    // Handle video/audio stream events
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

    // Handle ChainCast reactions
    socket.on('add_reaction', async (data: {
      chainCastId: string;
      emoji: string;
    }) => {
      try {
        if (!data.chainCastId || !data.emoji) {
          socket.emit('reaction_error', { error: 'ChainCast ID and emoji are required' });
          return;
        }

        if (!socket.chainCastId || socket.chainCastId !== data.chainCastId) {
          socket.emit('reaction_error', { error: 'You are not in this ChainCast' });
          return;
        }

        const chainCastService = container.get<IChainCastService>(TYPES.IChainCastService);
        await chainCastService.addReaction(socket.userId!, {
          chainCastId: data.chainCastId,
          emoji: data.emoji
        });

        const chainCastRoom = `chaincast:${data.chainCastId}`;
        
        // Broadcast reaction to all participants
        chainCastNamespace.to(chainCastRoom).emit('new_reaction', {
          userId: socket.userId,
          username: socket.username,
          emoji: data.emoji,
          timestamp: new Date()
        });

        logger.info('Reaction added to ChainCast', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId,
          emoji: data.emoji
        });

      } catch (error: any) {
        logger.error('Add ChainCast reaction error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('reaction_error', { error: error.message || 'Failed to add reaction' });
      }
    });

    // Handle moderation requests (for users)
    socket.on('request_moderation', async (data: {
      chainCastId: string;
      requestedPermissions: {
        video: boolean;
        audio: boolean;
      };
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

        const chainCastService = container.get<IChainCastService>(TYPES.IChainCastService);
        await chainCastService.requestModeration(socket.userId!, {
          chainCastId: data.chainCastId,
          requestedPermissions: data.requestedPermissions,
          message: data.message
        });

        // Notify admins about new moderation request
        const chainCastRoom = `chaincast:${data.chainCastId}`;
        socket.to(chainCastRoom).emit('moderation_request', {
          userId: socket.userId,
          username: socket.username,
          requestedPermissions: data.requestedPermissions,
          message: data.message,
          timestamp: new Date()
        });

        socket.emit('moderation_requested', { message: 'Moderation request submitted' });

        logger.info('Moderation requested', {
          socketId: socket.id,
          userId: socket.userId,
          chainCastId: data.chainCastId,
          requestedPermissions: data.requestedPermissions
        });

      } catch (error: any) {
        logger.error('Request moderation error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error.message
        });
        socket.emit('moderation_error', { error: error.message || 'Failed to request moderation' });
      }
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

        const chainCastService = container.get<IChainCastService>(TYPES.IChainCastService);
        const chainCastRoom = `chaincast:${data.chainCastId}`;

        switch (data.action) {
          case 'start':
            await chainCastService.startChainCast(socket.userId!, data.chainCastId);
            chainCastNamespace.to(chainCastRoom).emit('chaincast_started', {
              adminId: socket.userId,
              adminName: socket.username,
              timestamp: new Date()
            });
            break;

          case 'end':
            await chainCastService.endChainCast(socket.userId!, data.chainCastId);
            chainCastNamespace.to(chainCastRoom).emit('chaincast_ended', {
              adminId: socket.userId,
              adminName: socket.username,
              timestamp: new Date()
            });
            break;

          case 'remove_participant':
            if (!data.targetUserId) {
              socket.emit('admin_error', { error: 'Target user ID is required' });
              return;
            }
            await chainCastService.removeParticipant(socket.userId!, data.chainCastId, data.targetUserId, data.reason);
            
            // Notify the removed participant
            const targetSocket = participantSocketMap.get(data.targetUserId);
            if (targetSocket) {
              chainCastNamespace.to(targetSocket).emit('removed_from_chaincast', {
                adminName: socket.username,
                reason: data.reason,
                timestamp: new Date()
              });
            }
            break;

          case 'approve_moderation':
          case 'reject_moderation':
            if (!data.requestId) {
              socket.emit('admin_error', { error: 'Request ID is required' });
              return;
            }
            await chainCastService.reviewModerationRequest(socket.userId!, {
              requestId: data.requestId,
              status: data.action === 'approve_moderation' ? 'approved' : 'rejected',
              reviewMessage: data.reason
            });

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

        logger.info('Admin action completed', {
          socketId: socket.id,
          adminId: socket.userId,
          action: data.action,
          chainCastId: data.chainCastId
        });

      } catch (error: any) {
        logger.error('Admin action error', {
          socketId: socket.id,
          adminId: socket.userId,
          action: data.action,
          error: error.message
        });
        socket.emit('admin_error', { error: error.message || 'Failed to perform admin action' });
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtc_signal', (data: {
      chainCastId: string;
      targetUserId: string;
      signal: any;
      type: 'offer' | 'answer' | 'ice-candidate';
    }) => {
      if (!data.chainCastId || !socket.chainCastId || socket.chainCastId !== data.chainCastId) {
        socket.emit('webrtc_error', { error: 'Invalid ChainCast session' });
        return;
      }

      const targetSocket = participantSocketMap.get(data.targetUserId);
      if (targetSocket) {
        chainCastNamespace.to(targetSocket).emit('webrtc_signal', {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          signal: data.signal,
          type: data.type
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected from ChainCast socket', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        reason
      });

      if (socket.userId) {
        participantSocketMap.delete(socket.userId);

        // Clean up ChainCast connections
        const chainCastId = socketChainCastMap.get(socket.id);
        if (chainCastId) {
          const chainCastRoom = `chaincast:${chainCastId}`;
          
          // Notify others about participant leaving
          socket.to(chainCastRoom).emit('participant_left', {
            userId: socket.userId,
            username: socket.username,
            userType: socket.userType
          });

          chainCastSocketMap.get(chainCastId)?.delete(socket.id);
          if (chainCastSocketMap.get(chainCastId)?.size === 0) {
            chainCastSocketMap.delete(chainCastId);
          }
          socketChainCastMap.delete(socket.id);
        }
      }
    });

    socket.on('error', (error) => {
      logger.error('ChainCast socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    });
  });

  return { chainCastSocketMap, participantSocketMap };
};

// Helper functions
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