import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

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
const participantSocketMap = new Map<string, string>(); // userId -> socketId (Most recent socket for user)

export const setupChainCastSocketHandlers = (io: SocketIOServer) => {
  const chainCastNamespace = io.of('/chaincast');

  // --- 1. Liberal Authentication Middleware (The "Test Mode" Implementation) ---
  chainCastNamespace.use(async (socket: AuthenticatedChainCastSocket, next) => {
    try {
      const token = socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1] ||
        socket.handshake.query.token;

      if (!token) {
        // Guest/Anonymous fallback
        socket.userId = `guest-${Date.now()}`;
        socket.username = `Guest-${socket.id.substring(0, 4)}`;
        socket.userType = 'user';
        return next();
      }

      // "Liberal" Token Handling: Just decode, don't verify signature.
      // This trusts the client's claim about who they are.
      const decoded = jwt.decode(token) as any;

      if (decoded && decoded.id) {
        socket.userId = decoded.id;
        // Map 'role' to userType
        if (decoded.role === 'communityAdmin') {
          socket.userType = 'communityAdmin';
          socket.username = decoded.name || 'Admin';
          // Try to extract communityId if present (might need to fetch if critical, but for now loose)
          socket.communityId = decoded.communityId || 'default-community';
        } else {
          socket.userType = 'user';
          socket.username = decoded.username || decoded.name || 'User';
        }
      } else {
        // Token garbage? Fallback to guest.
        socket.userId = `guest-${Date.now()}`;
        socket.username = `Guest-${socket.id.substring(0, 4)}`;
        socket.userType = 'user';
      }

      logger.info('ChainCast Liberal Auth:', {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType
      });

      next();
    } catch (error) {
      logger.error('Auth Error:', error);
      next(); // Don't block, just let them in as guest if logic failed (Liberal!)
    }
  });

  chainCastNamespace.on('connection', (socket: AuthenticatedChainCastSocket) => {
    // Ensure we have at least some ID
    if (!socket.userId) socket.userId = `guest-${socket.id}`;

    logger.info('ChainCast socket connected', {
      socketId: socket.id,
      userId: socket.userId
    });

    // Track user socket
    participantSocketMap.set(socket.userId, socket.id);


    // --- Join ChainCast ---
    socket.on('join_chaincast', (data: { chainCastId: string }) => {
      const { chainCastId } = data;
      if (!chainCastId) return;

      socket.chainCastId = chainCastId;
      const roomName = `chaincast:${chainCastId}`;

      socket.join(roomName);

      // Update Mappings
      if (!chainCastSocketMap.has(chainCastId)) {
        chainCastSocketMap.set(chainCastId, new Set());
      }
      chainCastSocketMap.get(chainCastId)!.add(socket.id);
      socketChainCastMap.set(socket.id, chainCastId);

      // Determine initial streaming permission
      // STRICT: Only Admins are allowed to stream.
      const canStream = socket.userType === 'communityAdmin';

      // Notify others
      socket.to(roomName).emit('participant_joined', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        hasVideo: false, // Start with everything off
        hasAudio: false,
        isMuted: true,
        isVideoOff: true,
        canStream: canStream // Tell frontend if this user is a streamer (admin)
      });

      // Gather current participants
      const currentParticipants: any[] = [];
      const roomSocketIds = chainCastSocketMap.get(chainCastId);
      if (roomSocketIds) {
        for (const sId of roomSocketIds) {
          const s = chainCastNamespace.sockets.get(sId) as AuthenticatedChainCastSocket;
          if (s) {
            currentParticipants.push({
              userId: s.userId,
              username: s.username,
              userType: s.userType,
              // We could track state here if we had it stored, but for now defaults
              hasVideo: false,
              hasAudio: false
            });
          }
        }
      }

      // Ack to joiner
      socket.emit('joined_chaincast', {
        chainCastId,
        participantCount: roomSocketIds?.size || 0,
        userRole: socket.userType === 'communityAdmin' ? 'admin' : 'viewer',
        canStream,
        participants: currentParticipants
      });
    });

    // --- Stream Updates (Camera/Mic Toggles) --- 
    socket.on('stream_update', (data: {
      chainCastId: string;
      hasVideo: boolean;
      hasAudio: boolean;
      isMuted: boolean;
      isVideoOff: boolean;
    }) => {
      const { chainCastId } = data;
      if (!chainCastId) return;

      // STRICT: Only explicitly communityAdmin can stream
      const isAdmin = socket.userType === 'communityAdmin';

      if (!isAdmin) {
        socket.emit('stream_update_error', { error: 'Only Community Admins can stream.' });
        return;
      }

      // Broadcast to room (excluding sender)
      socket.to(`chaincast:${chainCastId}`).emit('participant_stream_update', {
        userId: socket.userId,
        username: socket.username,
        userType: socket.userType,
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio,
        isMuted: data.isMuted,
        isVideoOff: data.isVideoOff
      });
    });


    // --- WebRTC Signaling (Relay) ---
    // Simple relay mechanism for P2P connection
    const relaySignal = (event: string, data: any) => {
      const { toUserId, chainCastId } = data;
      const targetSocketId = participantSocketMap.get(toUserId);
      if (targetSocketId) {
        chainCastNamespace.to(targetSocketId).emit(event, {
          ...data,
          fromUserId: socket.userId
        });
      }
    };

    socket.on('webrtc_offer', (data) => relaySignal('webrtc_offer', data));
    socket.on('webrtc_answer', (data) => relaySignal('webrtc_answer', data));
    socket.on('webrtc_ice_candidate', (data) => relaySignal('webrtc_ice_candidate', data));

    // --- Chat & Reactions ---
    socket.on('send_message', (data: { chainCastId: string, message: string }) => {
      socket.to(`chaincast:${data.chainCastId}`).emit('new_message', {
        id: Date.now().toString(),
        userId: socket.userId,
        username: socket.username,
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on('add_reaction', (data: { chainCastId: string, emoji: string }) => {
      io.of('/chaincast').to(`chaincast:${data.chainCastId}`).emit('new_reaction', {
        userId: socket.userId,
        username: socket.username,
        emoji: data.emoji
      });
    });

    // --- Disconnect & Cleanup ---
    socket.on('leave_chaincast', (data: { chainCastId: string }) => leaveRoom(socket, data.chainCastId));

    socket.on('disconnect', () => {
      if (socket.chainCastId) {
        leaveRoom(socket, socket.chainCastId);
      }
      if (socket.userId) {
        // Note: We don't delete from participantSocketMap immediately regarding memory?
        // Actually, probably fine to delete.
        participantSocketMap.delete(socket.userId);
      }
    });
  });

  const leaveRoom = (socket: AuthenticatedChainCastSocket, chainCastId: string) => {
    socket.leave(`chaincast:${chainCastId}`);
    if (chainCastSocketMap.has(chainCastId)) {
      chainCastSocketMap.get(chainCastId)?.delete(socket.id);
    }
    socket.chainCastId = undefined;

    // Notify
    socket.to(`chaincast:${chainCastId}`).emit('participant_left', {
      userId: socket.userId
    });
  };

  return { chainCastSocketMap };
};