import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { communityApiService, ConversationResponse, ConversationListResponse, MessageResponse, MessageListResponse } from '@/services/communityApiService';
import { socketService } from '@/services/socketService';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useChat = () => {
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
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [socketConnected, setSocketConnected] = useState(false);

  const currentUser = useSelector((state: RootState) => state.userAuth?.user);
  const token = useSelector((state: RootState) => state.userAuth?.token);

  // Socket event handlers refs to prevent re-registering
  const socketEventHandlers = useRef<{ [key: string]: (data: any) => void }>({});
  const socketInitialized = useRef(false);

  // Initialize socket connection with better error handling and retry logic
  useEffect(() => {
    if (!token || !currentUser || socketInitialized.current) return;

    const initializeSocket = async () => {
      try {
        console.log('🔄 Initializing socket connection...');
        await socketService.connect(token);
        setSocketConnected(true);
        console.log('✅ Socket connection successful');
        socketInitialized.current = true;
      } catch (error: any) {
        console.warn('⚠️ Socket connection failed, using HTTP fallback:', error.message);
        setSocketConnected(false);
        // Don't show error toast for socket connection failures
        // The app should still work with HTTP API fallback
      }
    };

    initializeSocket();

    return () => {
      if (socketInitialized.current) {
        console.log('🧹 Cleaning up socket connection...');
        socketService.disconnect();
        setSocketConnected(false);
        socketInitialized.current = false;
      }
    };
  }, [token, currentUser]);

  // Setup socket event listeners
  useEffect(() => {
    if (!token || !currentUser || !socketConnected) return;

    console.log('🎧 Setting up socket event listeners...');

    // New message handler
    const handleNewMessage = (data: { message: MessageResponse; conversation: ConversationResponse }) => {
      console.log('📨 Received new message:', data);
      
      // Set the correct isOwnMessage flag based on current user
      const isOwnMessage = data.message.sender._id === currentUser?._id;
      const messageWithCorrectOwnership = {
        ...data.message,
        isOwnMessage
      };
      
      // Add message to the conversation
      setMessages(prev => ({
        ...prev,
        [data.conversation._id]: [
          ...(prev[data.conversation._id] || []),
          messageWithCorrectOwnership
        ]
      }));

      // Update conversation list
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === data.conversation._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...data.conversation, lastMessage: messageWithCorrectOwnership };
          // Move to top
          return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
        } else {
          return [{ ...data.conversation, lastMessage: messageWithCorrectOwnership }, ...prev];
        }
      });

      // Show notification if message is from another user
      if (!isOwnMessage) {
        toast.success(`New message from ${data.message.sender.name || data.message.sender.username}`);
      }
    };

    const handleMessageSent = (data: { message: MessageResponse; conversation: ConversationResponse }) => {
      console.log('✅ Message sent confirmation:', data);
      setSendingMessage(false);
      
      // Ensure the sent message is marked as own message
      const messageWithCorrectOwnership = {
        ...data.message,
        isOwnMessage: true
      };
      
      // Add message to the conversation if not already present
      setMessages(prev => {
        const existing = prev[data.conversation._id] || [];
        const messageExists = existing.some(msg => msg._id === messageWithCorrectOwnership._id);
        if (!messageExists) {
          return {
            ...prev,
            [data.conversation._id]: [...existing, messageWithCorrectOwnership]
          };
        }
        return prev;
      });

      // Update conversation list
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === data.conversation._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...data.conversation, lastMessage: messageWithCorrectOwnership };
          return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
        } else {
          return [{ ...data.conversation, lastMessage: messageWithCorrectOwnership }, ...prev];
        }
      });
    };

    const handleMessageEdited = (data: { message: MessageResponse }) => {
      console.log('✏️ Message edited:', data);
      
      // Set the correct isOwnMessage flag for edited messages
      const isOwnMessage = data.message.sender._id === currentUser?._id;
      const messageWithCorrectOwnership = {
        ...data.message,
        isOwnMessage
      };
      
      setMessages(prev => ({
        ...prev,
        [messageWithCorrectOwnership.conversationId]: (prev[messageWithCorrectOwnership.conversationId] || []).map(msg =>
          msg._id === messageWithCorrectOwnership._id ? messageWithCorrectOwnership : msg
        )
      }));
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      console.log('🗑️ Message deleted:', data);
      
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(msg =>
            msg._id === data.messageId ? { ...msg, isDeleted: true, content: 'This message was deleted' } : msg
          );
        });
        return updated;
      });
    };

    const handleMessagesRead = (data: { userId: string; conversationId: string; readAt: Date }) => {
      console.log('📖 Messages read:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: (prev[data.conversationId] || []).map(msg => ({
          ...msg,
          readBy: msg.readBy.some(r => r.user === data.userId)
            ? msg.readBy
            : [...msg.readBy, { user: data.userId, readAt: data.readAt }]
        }))
      }));
    };

    const handleConversationUpdated = (data: { conversation: ConversationResponse }) => {
      console.log('💬 Conversation updated:', data);
      
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === data.conversation._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data.conversation;
          return updated;
        } else {
          return [data.conversation, ...prev];
        }
      });
    };

    const handleUserTypingStart = (data: { userId: string; username: string }) => {
      console.log('⌨️ User typing start:', data);
      // TODO: Implement typing indicators UI
    };

    const handleUserTypingStop = (data: { userId: string; username: string }) => {
      console.log('⌨️ User typing stop:', data);
      // TODO: Implement typing indicators UI
    };

    const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => {
      console.log('👤 User status changed:', data);
      
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (data.isOnline) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    };

    const handleMessageError = (data: { error: string }) => {
      console.error('❌ Message error:', data);
      setSendingMessage(false);
      setError(data.error);
      toast.error(data.error);
    };

    const handleConversationError = (data: { error: string }) => {
      console.error('❌ Conversation error:', data);
      setError(data.error);
      toast.error(data.error);
    };

    // Store handlers in ref
    socketEventHandlers.current = {
      handleNewMessage,
      handleMessageSent,
      handleMessageEdited,
      handleMessageDeleted,
      handleMessagesRead,
      handleConversationUpdated,
      handleUserTypingStart,
      handleUserTypingStop,
      handleUserStatusChanged,
      handleMessageError,
      handleConversationError
    };

    // Register event listeners
    try {
      socketService.onNewMessage(handleNewMessage);
      socketService.onMessageSent(handleMessageSent);
      socketService.onMessageEdited(handleMessageEdited);
      socketService.onMessageDeleted(handleMessageDeleted);
      socketService.onMessagesRead(handleMessagesRead);
      socketService.onConversationUpdated(handleConversationUpdated);
      socketService.onUserTypingStart(handleUserTypingStart);
      socketService.onUserTypingStop(handleUserTypingStop);
      socketService.onUserStatusChanged(handleUserStatusChanged);
      socketService.onMessageError(handleMessageError);
      socketService.onConversationError(handleConversationError);

      console.log('✅ Socket event listeners registered successfully');
    } catch (error) {
      console.warn('⚠️ Socket event registration failed:', error);
    }

    return () => {
      // Cleanup event listeners
      try {
        socketService.offNewMessage(handleNewMessage);
        socketService.offMessageSent(handleMessageSent);
        socketService.offMessageEdited(handleMessageEdited);
        socketService.offMessageDeleted(handleMessageDeleted);
        socketService.offMessagesRead(handleMessagesRead);
        socketService.offConversationUpdated(handleConversationUpdated);
        socketService.offUserTypingStart(handleUserTypingStart);
        socketService.offUserTypingStop(handleUserTypingStop);
        socketService.offUserStatusChanged(handleUserStatusChanged);
        socketService.offMessageError(handleMessageError);
        socketService.offConversationError(handleConversationError);
        socketService.offConversationError(handleConversationError);
        console.log('🧹 Socket event listeners cleaned up');
      } catch (error) {
        console.warn('⚠️ Socket event cleanup failed:', error);
      }
    };
  }, [token, currentUser, socketConnected]);

  // Fetch conversations
  const fetchConversations = useCallback(async (cursor?: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await communityApiService.getConversations(cursor, 20, search);
      
      if (cursor) {
        // Load more - append to existing
        setConversations(prev => [...prev, ...response.conversations]);
      } else {
        // Fresh load - replace
        setConversations(response.conversations);
      }

      setHasMoreConversations(response.hasMore);
      setNextCursorConversations(response.nextCursor);

      console.log('📋 Fetched conversations:', response);
    } catch (error: any) {
      console.error('❌ Failed to fetch conversations:', error);
      setError(error.message);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await communityApiService.getConversationMessages(conversationId, cursor, 50);
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: cursor 
          ? [...response.messages, ...(prev[conversationId] || [])]
          : response.messages
      }));

      setHasMoreMessages(prev => ({
        ...prev,
        [conversationId]: response.hasMore
      }));

      setNextCursorMessages(prev => ({
        ...prev,
        [conversationId]: response.nextCursor
      }));

      console.log('💬 Fetched messages for conversation:', conversationId, response);
    } catch (error: any) {
      console.error('❌ Failed to fetch messages:', error);
      setError(error.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (receiverUsername: string, content: string) => {
    if (!content.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      console.log('📤 Attempting to send message...', { socketConnected, receiverUsername });

      if (socketConnected && socketService.isConnected()) {
        // Send via socket for real-time
        console.log('📤 Sending message via socket...');
        socketService.sendMessage({
          receiverUsername: receiverUsername.trim(),
          content: content.trim()
        });
        // Don't set sendingMessage to false here, wait for socket confirmation
      } else {
        // Fallback to HTTP API
        console.log('📤 Sending message via HTTP API (socket not available)...');
        const response = await communityApiService.sendMessage(receiverUsername, content);
        
        // Update local state
        setMessages(prev => ({
          ...prev,
          [response.conversation._id]: [
            ...(prev[response.conversation._id] || []),
            response.message
          ]
        }));

        // Update conversation list
        setConversations(prev => {
          const existingIndex = prev.findIndex(conv => conv._id === response.conversation._id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...response.conversation, lastMessage: response.message };
            return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
          } else {
            return [response.conversation, ...prev];
          }
        });

        setSendingMessage(false);
        console.log('✅ Message sent via HTTP:', response);
      }
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setError(error.message);
      setSendingMessage(false);
      toast.error('Failed to send message');
    }
  }, [socketConnected]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string, conversationId: string) => {
    if (!content.trim()) return;

    try {
      setError(null);

      if (socketConnected && socketService.isConnected()) {
        console.log('✏️ Editing message via socket...');
        socketService.editMessage({
          messageId,
          content: content.trim(),
          conversationId
        });
      } else {
        console.log('✏️ Editing message via HTTP API...');
        const updatedMessage = await communityApiService.editMessage(messageId, content);
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map(msg =>
            msg._id === messageId ? updatedMessage : msg
          )
        }));
      }

      console.log('✅ Message edited:', messageId);
    } catch (error: any) {
      console.error('❌ Failed to edit message:', error);
      setError(error.message);
      toast.error('Failed to edit message');
    }
  }, [socketConnected]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      setError(null);

      if (socketConnected && socketService.isConnected()) {
        console.log('🗑️ Deleting message via socket...');
        socketService.deleteMessage({
          messageId,
          conversationId
        });
      } else {
        console.log('🗑️ Deleting message via HTTP API...');
        await communityApiService.deleteMessage(messageId);
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map(msg =>
            msg._id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted' } : msg
          )
        }));
      }

      console.log('✅ Message deleted:', messageId);
      toast.success('Message deleted');
    } catch (error: any) {
      console.error('❌ Failed to delete message:', error);
      setError(error.message);
      toast.error('Failed to delete message');
    }
  }, [socketConnected]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      if (socketConnected && socketService.isConnected()) {
        console.log('📖 Marking messages as read via socket...');
        socketService.markMessagesAsRead({ conversationId });
      } else {
        console.log('📖 Marking messages as read via HTTP API...');
        await communityApiService.markMessagesAsRead(conversationId);
      }

      // Update local unread counts
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      console.log('✅ Messages marked as read:', conversationId);
    } catch (error: any) {
      console.error('❌ Failed to mark messages as read:', error);
    }
  }, [socketConnected]);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (username: string) => {
    try {
      setLoading(true);
      setError(null);

      const conversation = await communityApiService.getOrCreateConversation(username);
      
      // Add to conversations if not present
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });

      console.log('💬 Got/created conversation:', conversation);
      return conversation;
    } catch (error: any) {
      console.error('❌ Failed to get/create conversation:', error);
      setError(error.message);
      toast.error('Failed to open conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    try {
      if (socketConnected && socketService.isConnected()) {
        socketService.joinConversation(conversationId);
        console.log('✅ Joined conversation room:', conversationId);
      } else {
        console.warn('⚠️ Cannot join conversation room - socket not connected');
      }
    } catch (error) {
      console.warn('❌ Failed to join conversation room:', error);
    }
  }, [socketConnected]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    try {
      if (socketConnected && socketService.isConnected()) {
        socketService.leaveConversation(conversationId);
        console.log('✅ Left conversation room:', conversationId);
      } else {
        console.warn('⚠️ Cannot leave conversation room - socket not connected');
      }
    } catch (error) {
      console.warn('❌ Failed to leave conversation room:', error);
    }
  }, [socketConnected]);

  // Load more conversations
  const loadMoreConversations = useCallback(async (search?: string) => {
    if (hasMoreConversations && nextCursorConversations && !loading) {
      await fetchConversations(nextCursorConversations, search);
    }
  }, [hasMoreConversations, nextCursorConversations, loading, fetchConversations]);

  // Load more messages
  const loadMoreMessages = useCallback(async (conversationId: string) => {
    if (hasMoreMessages[conversationId] && nextCursorMessages[conversationId] && !loading) {
      await fetchMessages(conversationId, nextCursorMessages[conversationId]);
    }
  }, [hasMoreMessages, nextCursorMessages, loading, fetchMessages]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversations,
    messages,
    loading,
    sendingMessage,
    error,
    hasMoreConversations,
    hasMoreMessages,
    typingUsers,
    onlineUsers,
    socketConnected,
    
    // Actions
    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    getOrCreateConversation,
    joinConversation,
    leaveConversation,
    loadMoreConversations,
    loadMoreMessages,
    clearError
  };
};