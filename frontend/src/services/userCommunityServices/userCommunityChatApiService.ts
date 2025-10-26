import API from "@/lib/api-client";

// Community Channel Message interfaces
export interface CommunityChannelMessage {
  _id: string;
  communityId: string;
  admin: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  content: string;
  mediaFiles: {
    type: 'image' | 'video';
    url: string;
    filename: string;
  }[];
  messageType: 'text' | 'media' | 'mixed';
  isPinned: boolean;
  reactions: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  totalReactions: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Community Group Message interfaces
export interface CommunityGroupMessage {
  _id: string;
  communityId: string;
  sender: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
  };
  content: string;
  isEdited: boolean;
  editedAt?: Date;
  isCurrentUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMessagesResponse {
  messages: CommunityChannelMessage[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface GroupMessagesResponse {
  messages: CommunityGroupMessage[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface SendGroupMessageRequest {
  communityUsername: string;
  content: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("User Community Chat API Error:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method
  });

  if (error.response?.status === 401) {
    throw new Error("User not authenticated");
  }

  if (error.response?.status === 403) {
    throw new Error("Access forbidden - you may not be a community member");
  }

  if (error.response?.status === 404) {
    throw new Error("Resource not found");
  }

  if (error.response?.status === 429) {
    throw new Error("Too many requests. Please try again later");
  }

  if (error.response?.status >= 500) {
    throw new Error("Server error. Please try again later");
  }

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

export const userCommunityChatApiService = {
  // Community Channel Messages (Read-only for users)
  getChannelMessages: async (communityUsername: string, cursor?: string, limit: number = 20): Promise<ChannelMessagesResponse> => {
    try {
      if (!communityUsername?.trim()) {
        throw new Error("Community username is required");
      }

      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      console.log('API: Fetching channel messages:', { communityUsername, cursor, limit });

      const response = await API.get(`/api/user/community/${encodeURIComponent(communityUsername.trim())}/channel/messages?${params.toString()}`);

      console.log('API: Channel messages fetched successfully:', {
        messageCount: response.data?.data?.messages?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get channel messages");
    } catch (error: any) {
      console.error('API: Get channel messages failed:', error);
      handleApiError(error, "Failed to get channel messages");
      throw error;
    }
  },

  // React to channel message
  reactToChannelMessage: async (messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: any[] }> => {
    try {
      if (!messageId?.trim() || !emoji?.trim()) {
        throw new Error("Message ID and emoji are required");
      }

      console.log('API: Reacting to channel message:', { messageId, emoji });

      const response = await API.post(`/api/user/community/channel/messages/${encodeURIComponent(messageId.trim())}/react`, {
        emoji: emoji.trim()
      });

      console.log('API: Reaction added successfully:', {
        messageId,
        emoji,
        totalReactions: response.data?.data?.reactions?.length
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to add reaction");
    } catch (error: any) {
      console.error('API: React to channel message failed:', error);
      handleApiError(error, "Failed to add reaction");
      throw error;
    }
  },

  // Remove reaction from channel message
  removeChannelMessageReaction: async (messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: any[] }> => {
    try {
      if (!messageId?.trim() || !emoji?.trim()) {
        throw new Error("Message ID and emoji are required");
      }

      console.log('API: Removing reaction from channel message:', { messageId, emoji });

      const response = await API.delete(`/api/user/community/channel/messages/${encodeURIComponent(messageId.trim())}/react`, {
        data: { emoji: emoji.trim() }
      });

      console.log('API: Reaction removed successfully:', {
        messageId,
        emoji,
        totalReactions: response.data?.data?.reactions?.length
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to remove reaction");
    } catch (error: any) {
      console.error('API: Remove channel message reaction failed:', error);
      handleApiError(error, "Failed to remove reaction");
      throw error;
    }
  },

  // Community Group Chat Messages
  sendGroupMessage: async (data: SendGroupMessageRequest): Promise<CommunityGroupMessage> => {
    try {
      if (!data.communityUsername?.trim() || !data.content?.trim()) {
        throw new Error("Community username and message content are required");
      }

      console.log('API: Sending group message:', { 
        communityUsername: data.communityUsername,
        contentLength: data.content.length 
      });

      const response = await API.post('/api/user/community/group-chat/send', {
        communityUsername: data.communityUsername.trim(),
        content: data.content.trim()
      });

      console.log('API: Group message sent successfully:', {
        messageId: response.data?.data?._id,
        communityId: response.data?.data?.communityId
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to send group message");
    } catch (error: any) {
      console.error('API: Send group message failed:', error);
      handleApiError(error, "Failed to send group message");
      throw error;
    }
  },

  // Get group messages
  getGroupMessages: async (communityUsername: string, cursor?: string, limit: number = 50): Promise<GroupMessagesResponse> => {
    try {
      if (!communityUsername?.trim()) {
        throw new Error("Community username is required");
      }

      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString());

      console.log('API: Fetching group messages:', { communityUsername, cursor, limit });

      const response = await API.get(`/api/user/community/${encodeURIComponent(communityUsername.trim())}/group-chat/messages?${params.toString()}`);

      console.log('API: Group messages fetched successfully:', {
        messageCount: response.data?.data?.messages?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get group messages");
    } catch (error: any) {
      console.error('API: Get group messages failed:', error);
      handleApiError(error, "Failed to get group messages");
      throw error;
    }
  },

  // Edit group message
  editGroupMessage: async (messageId: string, content: string): Promise<CommunityGroupMessage> => {
    try {
      if (!messageId?.trim() || !content?.trim()) {
        throw new Error("Message ID and content are required");
      }

      console.log('API: Editing group message:', { messageId, contentLength: content.length });

      const response = await API.put(`/api/user/community/group-chat/messages/${encodeURIComponent(messageId.trim())}`, {
        content: content.trim()
      });

      console.log('API: Group message edited successfully:', {
        messageId: response.data?.data?._id,
        isEdited: response.data?.data?.isEdited
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to edit group message");
    } catch (error: any) {
      console.error('API: Edit group message failed:', error);
      handleApiError(error, "Failed to edit group message");
      throw error;
    }
  },

  // Delete group message
  deleteGroupMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!messageId?.trim()) {
        throw new Error("Message ID is required");
      }

      console.log('API: Deleting group message:', { messageId });

      const response = await API.delete(`/api/user/community/group-chat/messages/${encodeURIComponent(messageId.trim())}`);

      console.log('API: Group message deleted successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete group message");
    } catch (error: any) {
      console.error('API: Delete group message failed:', error);
      handleApiError(error, "Failed to delete group message");
      throw error;
    }
  },

  // Mark group messages as read
  markGroupMessagesAsRead: async (communityUsername: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!communityUsername?.trim()) {
        throw new Error("Community username is required");
      }

      console.log('API: Marking group messages as read:', { communityUsername });

      const response = await API.post(`/api/user/community/${encodeURIComponent(communityUsername.trim())}/group-chat/read`);

      console.log('API: Group messages marked as read successfully:', {
        communityUsername,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to mark messages as read");
    } catch (error: any) {
      console.error('API: Mark group messages as read failed:', error);
      handleApiError(error, "Failed to mark messages as read");
      throw error;
    }
  },

  // Helper functions
  formatDate: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatTime: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  formatTimeAgo: (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return userCommunityChatApiService.formatDate(date);
    }
  },

  getUserAvatarFallback: (name: string): string => {
    return name?.split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  }
};