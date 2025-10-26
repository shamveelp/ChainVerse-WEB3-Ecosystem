import API from "@/lib/api-client";

// Community Channel Message interfaces
export interface CommunityMessage {
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

export interface CreateChannelMessageRequest {
  content: string;
  mediaFiles?: {
    type: 'image' | 'video';
    url: string;
    publicId: string;
    filename: string;
  }[];
  messageType?: 'text' | 'media' | 'mixed';
}

export interface ChannelMessagesResponse {
  messages: CommunityMessage[];
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("Community Admin Chat API Error:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method
  });

  if (error.response?.status === 401) {
    throw new Error("Admin not authenticated");
  }

  if (error.response?.status === 403) {
    throw new Error("Access forbidden");
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

export const communityAdminChatApiService = {
  // Send message to community channel
  sendChannelMessage: async (data: CreateChannelMessageRequest): Promise<CommunityMessage> => {
    try {
      console.log('API: Sending channel message:', { 
        contentLength: data.content?.length,
        hasMediaFiles: !!data.mediaFiles?.length,
        messageType: data.messageType 
      });

      const response = await API.post('/api/community-admin/community/channel/send', data);

      console.log('API: Channel message sent successfully:', {
        messageId: response.data?.data?._id,
        messageType: response.data?.data?.messageType
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to send message");
    } catch (error: any) {
      console.error('API: Send channel message failed:', error);
      handleApiError(error, "Failed to send channel message");
      throw error;
    }
  },

  // Get channel messages
  getChannelMessages: async (cursor?: string, limit: number = 20): Promise<ChannelMessagesResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      console.log('API: Fetching channel messages:', { cursor, limit });

      const response = await API.get(`/api/community-admin/community/channel/messages?${params.toString()}`);

      console.log('API: Channel messages fetched successfully:', {
        messageCount: response.data?.data?.messages?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get messages");
    } catch (error: any) {
      console.error('API: Get channel messages failed:', error);
      handleApiError(error, "Failed to get channel messages");
      throw error;
    }
  },

  // Get group messages (admin can view group chat)
  getGroupMessages: async (cursor?: string, limit: number = 50): Promise<GroupMessagesResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString());

      console.log('API: Fetching group messages:', { cursor, limit });

      const response = await API.get(`/api/community-admin/community/group-chat/messages?${params.toString()}`);

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

  // Admin delete group message
  deleteGroupMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      console.log('API: Admin deleting group message:', { messageId });

      const response = await API.delete(`/api/community-admin/community/group-chat/messages/${encodeURIComponent(messageId)}`);

      console.log('API: Group message deleted successfully by admin:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete group message");
    } catch (error: any) {
      console.error('API: Admin delete group message failed:', error);
      handleApiError(error, "Failed to delete group message");
      throw error;
    }
  },

  // Update channel message
  updateChannelMessage: async (messageId: string, content: string): Promise<CommunityMessage> => {
    try {
      if (!messageId || !content?.trim()) {
        throw new Error("Message ID and content are required");
      }

      console.log('API: Updating channel message:', { messageId, contentLength: content.length });

      const response = await API.put(`/api/community-admin/community/channel/messages/${encodeURIComponent(messageId)}`, {
        content: content.trim()
      });

      console.log('API: Channel message updated successfully:', {
        messageId: response.data?.data?._id,
        isEdited: response.data?.data?.isEdited
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update message");
    } catch (error: any) {
      console.error('API: Update channel message failed:', error);
      handleApiError(error, "Failed to update channel message");
      throw error;
    }
  },

  // Delete channel message
  deleteChannelMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      console.log('API: Deleting channel message:', { messageId });

      const response = await API.delete(`/api/community-admin/community/channel/messages/${encodeURIComponent(messageId)}`);

      console.log('API: Channel message deleted successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete message");
    } catch (error: any) {
      console.error('API: Delete channel message failed:', error);
      handleApiError(error, "Failed to delete channel message");
      throw error;
    }
  },

  // Pin channel message
  pinChannelMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      console.log('API: Pinning channel message:', { messageId });

      const response = await API.post(`/api/community-admin/community/channel/messages/${encodeURIComponent(messageId)}/pin`);

      console.log('API: Channel message pinned successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to pin message");
    } catch (error: any) {
      console.error('API: Pin channel message failed:', error);
      handleApiError(error, "Failed to pin channel message");
      throw error;
    }
  },

  // Unpin channel message
  unpinChannelMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      console.log('API: Unpinning channel message:', { messageId });

      const response = await API.post(`/api/community-admin/community/channel/messages/${encodeURIComponent(messageId)}/unpin`);

      console.log('API: Channel message unpinned successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to unpin message");
    } catch (error: any) {
      console.error('API: Unpin channel message failed:', error);
      handleApiError(error, "Failed to unpin channel message");
      throw error;
    }
  },

  // Upload media for channel message
  uploadChannelMedia: async (files: File[]): Promise<{ mediaFiles: any[] }> => {
    try {
      if (!files || files.length === 0) {
        throw new Error("No files provided");
      }

      console.log('API: Uploading channel media:', { fileCount: files.length });

      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('media', file);
      });

      const response = await API.post('/api/community-admin/community/channel/upload-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('API: Channel media uploaded successfully:', {
        uploadedCount: response.data?.data?.mediaFiles?.length
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to upload media");
    } catch (error: any) {
      console.error('API: Upload channel media failed:', error);
      handleApiError(error, "Failed to upload channel media");
      throw error;
    }
  },

  // Get message reactions
  getMessageReactions: async (messageId: string): Promise<any> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      console.log('API: Getting message reactions:', { messageId });

      const response = await API.get(`/api/community-admin/community/channel/messages/${encodeURIComponent(messageId)}/reactions`);

      console.log('API: Message reactions fetched successfully:', {
        messageId,
        reactionCount: response.data?.data?.reactions?.length
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get message reactions");
    } catch (error: any) {
      console.error('API: Get message reactions failed:', error);
      handleApiError(error, "Failed to get message reactions");
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
      return communityAdminChatApiService.formatDate(date);
    }
  }
};