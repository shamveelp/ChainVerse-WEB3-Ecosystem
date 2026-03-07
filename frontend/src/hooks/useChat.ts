import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { communityApiService, ConversationResponse, MessageResponse } from '@/services/communityApiService';
import { socketService } from '@/services/socketService';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Room, RoomEvent } from 'livekit-client';

export const useChat = (receiverId?: string) => {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: MessageResponse[] }>({});
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<{ [conversationId: string]: boolean }>({});
  const [nextCursorConversations, setNextCursorConversations] = useState<string | undefined>();
  const [nextCursorMessages, setNextCursorMessages] = useState<{ [conversationId: string]: string | undefined }>({});
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: string[] }>({});
  const [offlineQueue, setOfflineQueue] = useState<{ receiverUsername: string, content: string, conversationId?: string, tempId: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [socketConnected, setSocketConnected] = useState(false);

  // LiveKit State
  const lkRoomRef = useRef<Room | null>(null);
  const [lkConnected, setLkConnected] = useState(false);

  const currentUser = useSelector((state: RootState) => state.userAuth?.user);
  const conversationsRef = useRef<ConversationResponse[]>([]);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const socketInitialized = useRef(false);

  // Sync conversations ref for LiveKit callbacks
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Socket initialization
  useEffect(() => {
    if (!currentUser || socketInitialized.current) return;

    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setSocketConnected(true);
        socketInitialized.current = true;
      } catch (error) {
        console.warn('⚠️ Socket connection failed:', error);
        setSocketConnected(false);
      }
    };

    initializeSocket();

    return () => {
      if (socketInitialized.current) {
        socketInitialized.current = false;
        setSocketConnected(false);
      }
    };
  }, [currentUser]);

  // helper for deduplication
  const isMessageProcessed = useCallback((messageId: string) => {
    if (processedMessageIds.current.has(messageId)) return true;
    processedMessageIds.current.add(messageId);
    setTimeout(() => processedMessageIds.current.delete(messageId), 10000);
    return false;
  }, []);

  // LiveKit Connection
  const connectLiveKit = useCallback(async (id: string) => {
    if (!currentUser) return;

    try {
      const { token, serverUrl } = await communityApiService.getLiveKitToken(id);
      const room = new Room();
      await room.connect(serverUrl, token);

      lkRoomRef.current = room;
      setLkConnected(true);

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'chat') {
          // Check deduplication (LiveKit logic doesn't have real IDs yet, but we'll check content/time)
          setMessages(prev => {
            const existing = prev[data.conversationId] || [];
            if (existing.some(m => m.content === data.content && Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 5000)) {
              return prev;
            }

            const conv = conversationsRef.current.find(c => c._id === data.conversationId);
            const senderInfo = conv?.participants.find(p => p._id === participant?.identity);

            const incomingMsg: MessageResponse = {
              _id: `lk_${Date.now()}`,
              conversationId: data.conversationId,
              sender: {
                _id: participant?.identity || '',
                username: participant?.name || senderInfo?.username || 'User',
                name: participant?.name || senderInfo?.name || 'User',
                profilePic: senderInfo?.profilePic || '',
                isVerified: senderInfo?.isVerified || false
              },
              content: data.content,
              messageType: 'text',
              createdAt: new Date(),
              updatedAt: new Date(),
              isOwnMessage: false,
              readBy: [],
              isDeleted: false
            };

            return { ...prev, [data.conversationId]: [...existing, incomingMsg] };
          });
        } else if (data.type === 'typing') {
          setTypingUsers(prev => {
            const current = prev[data.conversationId] || [];
            if (data.isTyping) {
              if (current.includes(data.username)) return prev;
              return { ...prev, [data.conversationId]: [...current, data.username] };
            } else {
              return { ...prev, [data.conversationId]: current.filter(u => u !== data.username) };
            }
          });
        } else if (data.type === 'edit') {
          setMessages(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || []).map(m =>
              m._id === data.messageId ? { ...m, content: data.content, editedAt: new Date(), updatedAt: new Date() } : m
            )
          }));
        } else if (data.type === 'delete') {
          setMessages(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || []).map(m =>
              m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
            )
          }));
        } else if (data.type === 'read') {
          setMessages(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || []).map(m => ({
              ...m,
              readBy: m.readBy.some(r => r.user === data.userId) ? m.readBy : [...m.readBy, { user: data.userId, readAt: data.readAt }]
            }))
          }));
        }
      });

      return room;
    } catch (err) {
      console.error('LiveKit connection error:', err);
      return null;
    }
  }, [currentUser]);

  const disconnectLiveKit = useCallback(() => {
    if (lkRoomRef.current) {
      lkRoomRef.current.disconnect();
      lkRoomRef.current = null;
    }
    setLkConnected(false);
  }, []);

  const sendTypingStatus = useCallback((conversationId: string, isTyping: boolean) => {
    // 1. Send via LiveKit (Instant P2P inside chat)
    if (lkRoomRef.current && currentUser) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({
        type: 'typing',
        conversationId,
        username: currentUser.username,
        isTyping
      }));
      lkRoomRef.current.localParticipant.publishData(data, { reliable: true });
    }

    // 2. Send via Socket.io (Global fallback for conversation lists)
    if (socketConnected && currentUser) {
      if (isTyping) {
        socketService.startTyping({ conversationId });
      } else {
        socketService.stopTyping({ conversationId });
      }
    }
  }, [currentUser, socketConnected]);

  // Socket Listeners (Passive/Global)
  useEffect(() => {
    if (!currentUser || !socketConnected) return;

    const handleNewMessage = (data: any) => {
      const { message, conversation } = data;
      if (isMessageProcessed(message._id)) return;

      const isOwnMessage = message.sender._id === currentUser._id;
      const msg = { ...message, isOwnMessage };

      setMessages(prev => {
        const existing = prev[conversation._id] || [];
        // Deduplicate LiveKit temporary messages
        const lkIdx = existing.findIndex(m => m._id.startsWith('lk_') && m.content === msg.content);
        if (lkIdx !== -1) {
          const updated = [...existing];
          updated[lkIdx] = msg;
          return { ...prev, [conversation._id]: updated };
        }
        if (existing.some(m => m._id === msg._id)) return prev;
        return { ...prev, [conversation._id]: [...existing, msg] };
      });

      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === conversation._id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...conversation, lastMessage: msg };
          return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
        }
        return [{ ...conversation, lastMessage: msg }, ...prev];
      });
    };

    const handleMessageEdited = (data: any) => {
      const { message } = data;
      const isOwnMessage = message.sender._id === currentUser._id;
      const msg = { ...message, isOwnMessage };

      setMessages(prev => ({
        ...prev,
        [msg.conversationId]: (prev[msg.conversationId] || []).map(m => m._id === msg._id ? msg : m)
      }));
    };

    const handleMessageDeleted = (data: any) => {
      const { messageId } = data;
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(cid => {
          updated[cid] = updated[cid].map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m);
        });
        return updated;
      });
    };

    const handleMessagesRead = (data: any) => {
      const { userId, conversationId, readAt } = data;
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => ({
          ...m,
          readBy: m.readBy.some(r => r.user === userId) ? m.readBy : [...m.readBy, { user: userId, readAt }]
        }))
      }));
    };

    const handleUserStatusChanged = (data: any) => {
      const { userId, isOnline } = data;
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handleUserTypingStart = (data: any) => {
      setTypingUsers(prev => {
        const current = prev[data.conversationId] || [];
        if (current.includes(data.user?.username)) return prev;
        return { ...prev, [data.conversationId]: [...current, data.user?.username] };
      });
    };

    const handleUserTypingStop = (data: any) => {
      setTypingUsers(prev => {
        const current = prev[data.conversationId] || [];
        return { ...prev, [data.conversationId]: current.filter(u => u !== data.user?.username) };
      });
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onMessagesRead(handleMessagesRead);
    socketService.onUserStatusChanged(handleUserStatusChanged);
    socketService.onUserTypingStart(handleUserTypingStart);
    socketService.onUserTypingStop(handleUserTypingStop);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageEdited(handleMessageEdited);
      socketService.offMessageDeleted(handleMessageDeleted);
      socketService.offMessagesRead(handleMessagesRead);
      socketService.offUserStatusChanged(handleUserStatusChanged);

      // Remove typing listeners
      const anySocket = socketService as any;
      if (anySocket.socket) {
        anySocket.socket.off('user_typing_start', handleUserTypingStart);
        anySocket.socket.off('user_typing_stop', handleUserTypingStop);
      }
    };
  }, [currentUser, socketConnected, isMessageProcessed]);

  // Actions
  const fetchConversations = useCallback(async (cursor?: string, search?: string) => {
    try {
      setLoading(true);
      const res = await communityApiService.getConversations(cursor, 20, search);
      setConversations(prev => cursor ? [...prev, ...res.conversations] : res.conversations);
      setHasMoreConversations(res.hasMore);
      setNextCursorConversations(res.nextCursor);

      // Auto-join socket rooms for global real-time events (typing, etc)
      res.conversations.forEach(c => {
        if (socketConnected) {
          socketService.joinConversation(c._id);
        }
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      setLoading(true);
      const res = await communityApiService.getConversationMessages(conversationId, cursor, 50);
      setMessages(prev => ({
        ...prev,
        [conversationId]: cursor ? [...res.messages, ...(prev[conversationId] || [])] : res.messages
      }));
      setHasMoreMessages(prev => ({ ...prev, [conversationId]: res.hasMore }));
      setNextCursorMessages(prev => ({ ...prev, [conversationId]: res.nextCursor }));
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (receiverUsername: string, content: string, conversationId?: string, retryTempId?: string) => {
    if (!content.trim()) return;
    const tempId = retryTempId || `lk_${Date.now()}`;
    try {
      setSendingMessage(true);
      const tempMsg: MessageResponse = {
        _id: tempId,
        conversationId: conversationId || '',
        sender: {
          _id: currentUser?._id || '',
          username: currentUser?.username || 'You',
          name: currentUser?.name || 'You',
          profilePic: currentUser?.profilePic || '',
          isVerified: (currentUser as any)?.isVerified || false
        },
        content: content.trim(),
        messageType: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwnMessage: true,
        readBy: [],
        isDeleted: false
      };

      // 1. Add temp message to UI immediately (skip if this is an automatic retry)
      if (conversationId && !retryTempId) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), tempMsg]
        }));
      }

      // Check if completely offline before hitting API/LiveKit
      if (!navigator.onLine) {
        setOfflineQueue(prev => [...prev, { receiverUsername, content, conversationId, tempId }]);
        toast.info('You are offline. Message queued and will auto-send when connection returns.');
        setSendingMessage(false);
        return;
      }

      // 2. LiveKit (Instant Peer-to-Peer)
      if (lkRoomRef.current && conversationId) {
        const data = new TextEncoder().encode(JSON.stringify({ type: 'chat', content: content.trim(), conversationId, timestamp: Date.now() }));
        lkRoomRef.current.localParticipant.publishData(data, { reliable: true });
      }

      // 3. API (Persistence)
      const res = await communityApiService.sendMessage(receiverUsername, content);
      isMessageProcessed(res.message._id); // Mark as processed to avoid socket duplicate

      setMessages(prev => {
        const existing = prev[res.conversation._id] || [];
        // Replace matching LiveKit temp message with real persistent message
        const lkIdx = existing.findIndex(m => m._id.startsWith('lk_') && m.content === res.message.content);
        if (lkIdx !== -1) {
          const updated = [...existing];
          updated[lkIdx] = res.message;
          return { ...prev, [res.conversation._id]: updated };
        }
        if (existing.some(m => m._id === res.message._id)) return prev;
        return { ...prev, [res.conversation._id]: [...existing, res.message] };
      });

      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === res.conversation._id);
        const updatedConv = { ...res.conversation, lastMessage: res.message };
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = updatedConv;
          return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
        }
        return [updatedConv, ...prev];
      });
      setSendingMessage(false);
    } catch (err: any) {
      if (!navigator.onLine || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch')) {
        setOfflineQueue(prev => {
          if (prev.some(q => q.tempId === tempId)) return prev;
          return [...prev, { receiverUsername, content, conversationId, tempId }];
        });
        toast.info('Network dropped. Message queued for automatic retry.');
      } else {
        setError(err.message);
        toast.error('Failed to send message');
      }
      setSendingMessage(false);
    }
  }, [isMessageProcessed, currentUser]);

  const editMessage = useCallback(async (messageId: string, content: string, conversationId: string) => {
    try {
      // 1. Optimistic UI update locally
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => m._id === messageId ? { ...m, content, editedAt: new Date() } : m)
      }));

      // 2. Instant LiveKit broadcast
      if (lkRoomRef.current) {
        const data = new TextEncoder().encode(JSON.stringify({ type: 'edit', messageId, content, conversationId }));
        lkRoomRef.current.localParticipant.publishData(data, { reliable: true });
      }

      // 3. Persistent API sync
      const updated = await communityApiService.editMessage(messageId, content);

      // Update with exact server payload 
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => m._id === messageId ? updated : m)
      }));
    } catch (err: any) {
      toast.error('Failed to edit message');
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      // 1. Optimistic UI update locally
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m)
      }));

      // 2. Instant LiveKit broadcast
      if (lkRoomRef.current) {
        const data = new TextEncoder().encode(JSON.stringify({ type: 'delete', messageId, conversationId }));
        lkRoomRef.current.localParticipant.publishData(data, { reliable: true });
      }

      // 3. Persistent API sync
      await communityApiService.deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (err: any) {
      toast.error('Failed to delete message');
    }
  }, []);

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      if (lkRoomRef.current && currentUser) {
        const data = new TextEncoder().encode(JSON.stringify({ type: 'read', conversationId, userId: currentUser._id, readAt: new Date() }));
        lkRoomRef.current.localParticipant.publishData(data, { reliable: true });
      }
      await communityApiService.markMessagesAsRead(conversationId);
    } catch (err) { }
  }, [currentUser]);

  const getOrCreateConversation = useCallback(async (username: string) => {
    try {
      return await communityApiService.getOrCreateConversation(username);
    } catch (err: any) {
      toast.error('Failed to get conversation');
      return null;
    }
  }, []);

  const joinConversation = useCallback(async (conversationId: string) => {
    if (socketConnected) socketService.joinConversation(conversationId);
  }, [socketConnected]);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (socketConnected) socketService.leaveConversation(conversationId);
  }, [socketConnected]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    const cursor = nextCursorMessages[conversationId];
    if (cursor && !loading) await fetchMessages(conversationId, cursor);
  }, [nextCursorMessages, loading, fetchMessages]);

  const loadMoreConversations = useCallback(async (search?: string) => {
    if (nextCursorConversations && !loading) await fetchConversations(nextCursorConversations, search);
  }, [nextCursorConversations, loading, fetchConversations]);

  const clearError = useCallback(() => setError(null), []);

  // Auto-retry offline queue
  useEffect(() => {
    const handleOnline = () => {
      if (offlineQueue.length > 0) {
        toast.success(`Back online! Syncing ${offlineQueue.length} pending messages...`);
        // Extract queue to avoid infinite loop references safely
        const queueToProcess = [...offlineQueue];
        setOfflineQueue([]);
        queueToProcess.forEach(msg => {
          sendMessage(msg.receiverUsername, msg.content, msg.conversationId, msg.tempId);
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineQueue, sendMessage]);

  return {
    conversations, messages, loading, sendingMessage, error, hasMoreConversations, hasMoreMessages,
    typingUsers, onlineUsers, socketConnected, lkConnected, offlineQueue,
    fetchConversations, fetchMessages, sendMessage, editMessage, deleteMessage, markMessagesAsRead,
    getOrCreateConversation, joinConversation, leaveConversation, connectLiveKit, disconnectLiveKit,
    loadMoreConversations, loadMoreMessages, sendTypingStatus, clearError
  };
};