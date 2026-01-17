import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";
export type {
  CommunityMessage,
  CommunityGroupMessage,
  CreateChannelMessageRequest,
  ChannelMessagesResponse,
  GroupMessagesResponse
} from "@/types/comms-admin/chat.types";

import {
  CommunityMessage,
  CommunityGroupMessage,
  CreateChannelMessageRequest,
  ChannelMessagesResponse,
  GroupMessagesResponse
} from "@/types/comms-admin/chat.types";

interface UploadedMediaFile {
  type: 'image' | 'video';
  url: string;
  publicId: string;
  filename: string;
}

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

// Helper function to handle API errors
const handleApiError = (error: unknown, defaultMessage: string) => {
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data as Record<string, unknown>;

  console.error("Community Admin Chat API Error:", {
    status: status,
    statusText: axiosError.response?.statusText,
    data: data,
    message: axiosError.message,
    url: axiosError.config?.url,
    method: axiosError.config?.method
  });

  if (status === 401) {
    throw new Error("Admin not authenticated");
  }

  if (status === 403) {
    throw new Error("Access forbidden");
  }

  if (status === 404) {
    throw new Error("Resource not found");
  }

  if (status === 429) {
    throw new Error("Too many requests. Please try again later");
  }

  if (status && status >= 500) {
    throw new Error("Server error. Please try again later");
  }

  const errorMessage = (data?.error as string) ||
    (data?.message as string) ||
    axiosError.message ||
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

      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_SEND, data);

      console.log('API: Channel message sent successfully:', {
        messageId: response.data?.data?._id,
        messageType: response.data?.data?.messageType
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to send message");
    } catch (error) {
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

      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGES}?${params.toString()}`);

      console.log('API: Channel messages fetched successfully:', {
        messageCount: response.data?.data?.messages?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get messages");
    } catch (error) {
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

      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.GROUP_MESSAGES}?${params.toString()}`);

      console.log('API: Group messages fetched successfully:', {
        messageCount: response.data?.data?.messages?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get group messages");
    } catch (error) {
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

      const response = await API.delete(COMMUNITY_ADMIN_API_ROUTES.GROUP_MESSAGE_BY_ID(encodeURIComponent(messageId)));

      console.log('API: Group message deleted successfully by admin:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete group message");
    } catch (error) {
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

      const response = await API.put(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGE_BY_ID(encodeURIComponent(messageId)), {
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
    } catch (error) {
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

      const response = await API.delete(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGE_BY_ID(encodeURIComponent(messageId)));

      console.log('API: Channel message deleted successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete message");
    } catch (error) {
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

      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGE_PIN(encodeURIComponent(messageId)));

      console.log('API: Channel message pinned successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to pin message");
    } catch (error) {
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
      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGE_UNPIN(encodeURIComponent(messageId)));

      console.log('API: Channel message unpinned successfully:', {
        messageId,
        success: response.data?.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to unpin message");
    } catch (error) {
      console.error('API: Unpin channel message failed:', error);
      handleApiError(error, "Failed to unpin channel message");
      throw error;
    }
  },

  // Upload media for channel message
  uploadChannelMedia: async (files: File[]): Promise<{ mediaFiles: UploadedMediaFile[] }> => {
    try {
      if (!files || files.length === 0) {
        throw new Error("No files provided");
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('media', file);
      });

      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_UPLOAD_MEDIA, formData, {
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
    } catch (error) {
      console.error('API: Upload channel media failed:', error);
      handleApiError(error, "Failed to upload channel media");
      throw error;
    }
  },

  // Get message reactions
  getMessageReactions: async (messageId: string): Promise<{ reactions: Reaction[] }> => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      const response = await API.get(COMMUNITY_ADMIN_API_ROUTES.CHANNEL_MESSAGE_REACTIONS(encodeURIComponent(messageId)));

      console.log('API: Message reactions fetched successfully:', {
        messageId,
        reactionCount: response.data?.data?.reactions?.length
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get message reactions");
    } catch (error) {
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
