import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';

interface AuthenticatedChainCastSocket extends Socket {
  userId?: string;
  username?: string;
  userType?: 'user' | 'communityAdmin';
  communityId?: string;
  chainCastId?: string;
}

// Store socket mappings for ChainCast - Liberal approach
const chainCastSocketMap = new Map<string, Set<string>>(); // chainCastId -> Set<socketId>
const socketChainCastMap = new Map<string, string>(); // socketId -> chainCastId
const participantSocketMap = new Map<string, string>(); // participantId -> socketId
const socketUserMap = new Map<string, { userId: string; username: string; userType: string }>(); // socketId -> user info

export const setupChainCastSocketHandlers = (io: SocketIOServer) => {
  const chainCastNamespace = io.of('/chaincast');

  // Liberal authentication middleware
  chainCastNamespace.use(async (socket: AuthenticatedChainCastSocket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      // Liberal token checking - accept any token for testing
      if (!token) {
        logger.warn('ChainCast socket: No token provided, using default', { socketId: socket.id });
        // Set default user info for liberal testing
        socket.userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        socket.username = `User-${socket.id.substr(0, 6)}`;
        socket.userType = 'user';
      } else {
        // Liberal token parsing
        try {
          if (token === 'liberal-token' || token.includes('admin')) {
            socket.userId = `admin-${Date.now()}`;
            socket.username = `Admin-${socket.id.substr(0, 6)}`;
            socket.userType = 'communityAdmin';
            socket.communityId = 'default-community';
          } else {
            socket.userId = `user-${Date.now()}`;
            socket.username = `User-${socket.id.substr(0, 6)}`;
            socket.userType = 'user';
          }
        } catch (error) {
          logger.warn('Liberal auth fallback', { socketId: socket.id });
          socket.userId = `user-${Date.now()}`;
          socket.username = `User-${socket.id.substr(0, 6)}`;
          socket.userType = 'user';
        }
      }

      const userInfo = { 
        userId: socket.userId, 
        username: socket.username, 
        userType: socket.userType 
      };
      
      socketUserMap.set(socket.id, userInfo);
      logger.info('ChainCast socket authenticated (liberal)', {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType,
        username: socket.username
      });
      next();
    } catch (error) {
      const err = error as Error;
      logger.error('ChainCast socket auth error (liberal fallback)', { error: err.message });
      
      // Liberal fallback - always allow connection
      socket.userId = `guest-${Date.now()}`;
      socket.username = `Guest-${socket.id.substr(0, 6)}`;
      socket.userType = 'user';
      socketUserMap.set(socket.id, { 
        userId: socket.userId, 
        username: socket.username, 
        userType: socket.userType 
      });
      next();
    }
  });

  chainCastNamespace.on('connection', (socket: AuthenticatedChainCastSocket) => {
    if (!socket.userId) {
      logger.warn('Socket connected without userId, disconnecting', { socketId: socket.id });
      socket.disconnect(true);
      return;
    }

    logger.info('ChainCast socket connected', {
      socketId: socket.id,
      userId: socket.userId,
      userType: socket.userType,
      username: socket.username
    });

    // Store participant socket mapping
    participantSocketMap.set(socket.userId, socket.id);

    // Join ChainCast room - Liberal approach
    socket.on('join_chaincast', async (data: { chainCastId: string }) => {
      try {
        if (!data.chainCastId) {
          logger.warn('Join chaincast: Missing chainCastId', { socketId: socket.id });
          socket.emit('join_error', { error: 'ChainCast ID is required' });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;
        
        // Leave any existing room first
        if (socket.chainCastId) {
          const oldRoom = `chaincast:${socket.chainCastId}`;
          socket.leave(oldRoom);
          cleanupSocketFromRoom(socket, socket.chainCastId);
        }

        // Join new room
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

        // Confirm join to the user
        socket.emit('joined_chaincast', {
          chainCastId: data.chainCastId,
          participantCount,
          userRole: socket.userType === 'communityAdmin' ? 'admin' : 'viewer'
        });

        logger.info('User joined ChainCast', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          chainCastId: data.chainCastId,
          participantCount,
          userType: socket.userType
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
      if (data.chainCastId) {
        leaveChainCastRoom(socket, data.chainCastId);
      } else if (socket.chainCastId) {
        leaveChainCastRoom(socket, socket.chainCastId);
      }
    });

    // Handle stream updates - Liberal approach
    socket.on('stream_update', (data: {
      chainCastId: string;
      hasVideo: boolean;
      hasAudio: boolean;
      isMuted: boolean;
      isVideoOff: boolean;
    }) => {
      try {
        if (!data.chainCastId) {
          logger.warn('Stream update: Missing chainCastId', { socketId: socket.id });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;

        // Broadcast stream update to all participants in room
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
          hasAudio: data.hasAudio,
          participantCount: chainCastSocketMap.get(data.chainCastId)?.size || 0
        });
      } catch (error: any) {
        logger.error('Stream update error', { 
          socketId: socket.id, 
          userId: socket.userId, 
          error: error.message 
        });
      }
    });

    // Handle reactions - Liberal approach
    socket.on('add_reaction', async (data: { chainCastId: string; emoji: string }) => {
      try {
        if (!data.chainCastId || !data.emoji) {
          logger.warn('Add reaction: Missing data', { 
            socketId: socket.id,
            chainCastId: data.chainCastId,
            hasEmoji: !!data.emoji
          });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;

        // Broadcast reaction to all participants including sender
        const reactionData = {
          userId: socket.userId,
          username: socket.username,
          emoji: data.emoji,
          timestamp: new Date()
        };

        chainCastNamespace.to(chainCastRoom).emit('new_reaction', reactionData);

        logger.info('Reaction broadcast', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          chainCastId: data.chainCastId,
          emoji: data.emoji,
          roomSize: chainCastSocketMap.get(data.chainCastId)?.size || 0
        });

      } catch (error: any) {
        logger.error('Add reaction error', { 
          socketId: socket.id, 
          userId: socket.userId, 
          error: error.message 
        });
      }
    });

    // Handle moderation requests (for users) - Liberal approach
    socket.on('request_moderation', async (data: {
      chainCastId: string;
      requestedPermissions: { video: boolean; audio: boolean };
      message?: string;
    }) => {
      try {
        if (!data.chainCastId) {
          logger.warn('Request moderation: Missing chainCastId', { socketId: socket.id });
          return;
        }

        const chainCastRoom = `chaincast:${data.chainCastId}`;

        // Notify all participants about moderation request (liberal - let admins see it)
        socket.to(chainCastRoom).emit('moderation_request', {
          userId: socket.userId,
          username: socket.username,
          userType: socket.userType,
          requestedPermissions: data.requestedPermissions,
          message: data.message,
          timestamp: new Date()
        });

        // Confirm request sent
        socket.emit('moderation_requested', { message: 'Moderation request sent to admin' });

        logger.info('Moderation requested', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          chainCastId: data.chainCastId,
          requestedPermissions: data.requestedPermissions
        });

      } catch (error: any) {
        logger.error('Request moderation error', { 
          socketId: socket.id, 
          userId: socket.userId, 
          error: error.message 
        });
      }
    });

    // Handle chat messages - Liberal approach with enhanced broadcasting
    socket.on('send_message', (data: { chainCastId: string; message: string }) => {
      try {
        if (!data.chainCastId || !data.message?.trim()) {
          logger.warn('Send message: Invalid data', { 
            socketId: socket.id,
            hasChainCastId: !!data.chainCastId,
            hasMessage: !!data.message?.trim()
          });
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

        // Broadcast to all participants in the room (including sender)
        chainCastNamespace.to(chainCastRoom).emit('new_message', messageData);

        logger.info('Chat message broadcast', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          chainCastId: data.chainCastId,
          messageId,
          messageLength: data.message.trim().length,
          roomSize: chainCastSocketMap.get(data.chainCastId)?.size || 0
        });

      } catch (error: any) {
        logger.error('Send message error', { 
          socketId: socket.id, 
          userId: socket.userId, 
          error: error.message 
        });
      }
    });

    // Handle admin actions - Liberal approach
    socket.on('admin_action', async (data: {
      action: 'start' | 'end' | 'remove_participant' | 'approve_moderation' | 'reject_moderation';
      chainCastId: string;
      targetUserId?: string;
      requestId?: string;
      reason?: string;
    }) => {
      try {
        if (!data.chainCastId || !data.action) {
          logger.warn('Admin action: Missing data', { socketId: socket.id });
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

        logger.info('Admin action completed', {
          socketId: socket.id,
          userId: socket.userId,
          action: data.action,
          chainCastId: data.chainCastId
        });

      } catch (error: any) {
        logger.error('Admin action error', { 
          socketId: socket.id, 
          userId: socket.userId, 
          error: error.message 
        });
        socket.emit('admin_error', { error: 'Failed to perform admin action' });
      }
    });

    // Handle disconnect - Liberal cleanup
    socket.on('disconnect', (reason) => {
      logger.info('ChainCast socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        reason,
        chainCastId: socket.chainCastId
      });

      cleanup(socket);
    });

    // Handle errors liberally
    socket.on('error', (error) => {
      logger.error('ChainCast socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message || error
      });
    });
  });

  // Helper functions with liberal approach
  function leaveChainCastRoom(socket: AuthenticatedChainCastSocket, chainCastId: string) {
    const chainCastRoom = `chaincast:${chainCastId}`;
    socket.leave(chainCastRoom);

    // Notify others about participant leaving
    socket.to(chainCastRoom).emit('participant_left', {
      userId: socket.userId,
      username: socket.username,
      userType: socket.userType
    });

    cleanupSocketFromRoom(socket, chainCastId);

    const participantCount = chainCastSocketMap.get(chainCastId)?.size || 0;
    
    // Send leave confirmation
    socket.emit('left_chaincast', {
      chainCastId,
      participantCount
    });

    logger.info('User left ChainCast', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      chainCastId,
      participantCount
    });
  }

  function cleanupSocketFromRoom(socket: AuthenticatedChainCastSocket, chainCastId: string) {
    // Remove from tracking
    chainCastSocketMap.get(chainCastId)?.delete(socket.id);
    if (chainCastSocketMap.get(chainCastId)?.size === 0) {
      chainCastSocketMap.delete(chainCastId);
    }
    socketChainCastMap.delete(socket.id);
    socket.chainCastId = undefined;
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

// Helper functions for external use - Liberal approach
export const emitToChainCast = (io: SocketIOServer, chainCastId: string, event: string, data: any) => {
  try {
    const chainCastNamespace = io.of('/chaincast');
    const roomName = `chaincast:${chainCastId}`;
    chainCastNamespace.to(roomName).emit(event, data);
    
    logger.info('Broadcast to ChainCast', {
      chainCastId,
      event,
      roomName,
      participantCount: chainCastSocketMap.get(chainCastId)?.size || 0
    });
  } catch (error: any) {
    logger.error('Emit to ChainCast error', { 
      chainCastId, 
      event, 
      error: error.message 
    });
  }
};

export const getChainCastConnections = (chainCastId: string): number => {
  return chainCastSocketMap.get(chainCastId)?.size || 0;
};

export const notifyParticipant = (io: SocketIOServer, userId: string, event: string, data: any) => {
  try {
    const chainCastNamespace = io.of('/chaincast');
    const socketId = participantSocketMap.get(userId);
    if (socketId) {
      chainCastNamespace.to(socketId).emit(event, data);
      logger.info('Notified participant', { userId, event, socketId });
    } else {
      logger.warn('Participant socket not found', { userId, event });
    }
  } catch (error: any) {
    logger.error('Notify participant error', { 
      userId, 
      event, 
      error: error.message 
    });
  }
};

// Export socket maps for debugging
export const getSocketMaps = () => {
  return {
    chainCastSocketMap: Object.fromEntries(chainCastSocketMap.entries()),
    socketChainCastMap: Object.fromEntries(socketChainCastMap.entries()),
    participantSocketMap: Object.fromEntries(participantSocketMap.entries()),
    socketUserMap: Object.fromEntries(socketUserMap.entries())
  };
};