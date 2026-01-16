import API from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { AxiosError } from "axios";

import {
  CommunityProfile,
  UserFollowInfo,
  FollowListResponse,
  FollowResponse,
  UpdateCommunityProfileData,
  MessageResponse,
  ConversationResponse,
  ConversationListResponse,
  MessageListResponse,
  SendMessageResponse
} from "@/types/user/community.types";

export type {
  CommunityProfile,
  UserFollowInfo,
  FollowListResponse,
  FollowResponse,
  UpdateCommunityProfileData,
  MessageResponse,
  ConversationResponse,
  ConversationListResponse,
  MessageListResponse,
  SendMessageResponse
};

// Helper function to handle API errors consistently
const handleApiError = (error: AxiosError, defaultMessage: string) => {
  console.error("Community API Error:", {
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
    throw new Error("Access forbidden");
  }

  if (error.response?.status === 404) {
    throw new Error("Resource not found");
  }

  if (error.response?.status === 429) {
    throw new Error("Too many requests. Please try again later");
  }

  if (error.response?.status && error.response.status >= 500) {
    throw new Error("Server error. Please try again later");
  }

  const errorMessage = (error.response?.data as any)?.error ||
    (error.response?.data as any)?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to transform profile data with better error handling
const transformProfileData = (data: Partial<CommunityProfile> & Record<string, any>): CommunityProfile => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid profile data received');
  }

  return {
    _id: data._id || '',
    username: data.username || '',
    name: data.name || data.username || '',
    email: data.email || '',
    profilePic: data.profilePic || '',
    followersCount: Number(data.followersCount) || 0,
    followingCount: Number(data.followingCount) || 0,
    bio: data.bio || '',
    location: data.location || '',
    website: data.website || '',
    bannerImage: data.bannerImage || '',
    isVerified: Boolean(data.isVerified),
    postsCount: Number(data.postsCount) || 0,
    likesReceived: Number(data.likesReceived) || 0,
    socialLinks: {
      twitter: data.socialLinks?.twitter || '',
      instagram: data.socialLinks?.instagram || '',
      linkedin: data.socialLinks?.linkedin || '',
      github: data.socialLinks?.github || ''
    },
    settings: {
      isProfilePublic: data.settings?.isProfilePublic ?? true,
      allowDirectMessages: data.settings?.allowDirectMessages ?? true,
      showFollowersCount: data.settings?.showFollowersCount ?? true,
      showFollowingCount: data.settings?.showFollowingCount ?? true
    },
    joinDate: data.joinDate || data.createdAt || new Date().toISOString(),
    isOwnProfile: Boolean(data.isOwnProfile),
    isFollowing: Boolean(data.isFollowing)
  };
};

export const communityApiService = {
  // Get own community profile
  getCommunityProfile: async (): Promise<{ data: CommunityProfile }> => {
    try {

      const response = await API.get(USER_API_ROUTES.COMMUNITY_PROFILE);


      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);

        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "No profile data received");
    } catch (error) {
      console.error('API: Get community profile failed:', error);
      handleApiError(error as AxiosError, "Failed to fetch community profile");
      throw error;
    }
  },

  // Get community profile by username
  getCommunityProfileByUsername: async (username: string): Promise<{ data: CommunityProfile }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();


      const response = await API.get(USER_API_ROUTES.COMMUNITY_PROFILE_BY_USERNAME(cleanUsername));


      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);

        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Profile not found");
    } catch (error) {
      console.error(`API: Get profile by username failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to fetch community profile");
      throw error;
    }
  },

  // Follow user
  followUser: async (username: string): Promise<FollowResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();


      const response = await API.post(USER_API_ROUTES.COMMUNITY_FOLLOW, { username: cleanUsername });


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to follow user");
    } catch (error) {
      console.error(`API: Follow user failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to follow user");
      throw error;
    }
  },

  // Unfollow user
  unfollowUser: async (username: string): Promise<FollowResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();


      const response = await API.post(USER_API_ROUTES.COMMUNITY_UNFOLLOW, { username: cleanUsername });


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to unfollow user");
    } catch (error) {
      console.error(`API: Unfollow user failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to unfollow user");
      throw error;
    }
  },

  // Get followers
  getFollowers: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.COMMUNITY_FOLLOWERS}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get followers");
    } catch (error) {
      console.error('API: Get followers failed:', error);
      handleApiError(error as AxiosError, "Failed to get followers");
      throw error;
    }
  },

  // Get following
  getFollowing: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.COMMUNITY_FOLLOWING}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get following");
    } catch (error) {
      console.error('API: Get following failed:', error);
      handleApiError(error as AxiosError, "Failed to get following");
      throw error;
    }
  },

  // Get user followers by username
  getUserFollowers: async (username: string, cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.COMMUNITY_USER_FOLLOWERS(cleanUsername)}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get user followers");
    } catch (error) {
      console.error(`API: Get user followers failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to get user followers");
      throw error;
    }
  },

  // Get user following by username
  getUserFollowing: async (username: string, cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.COMMUNITY_USER_FOLLOWING(cleanUsername)}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get user following");
    } catch (error) {
      console.error(`API: Get user following failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to get user following");
      throw error;
    }
  },

  // Get follow status
  getFollowStatus: async (username: string): Promise<{ isFollowing: boolean }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();


      const response = await API.get(USER_API_ROUTES.COMMUNITY_FOLLOW_STATUS(cleanUsername));


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get follow status");
    } catch (error) {
      console.error(`API: Get follow status failed for ${username}:`, error);
      handleApiError(error as AxiosError, "Failed to get follow status");
      throw error;
    }
  },

  // Update community profile
  updateCommunityProfile: async (profileData: UpdateCommunityProfileData): Promise<{
    success: boolean;
    data?: CommunityProfile;
    error?: string;
    message?: string;
  }> => {
    if (!profileData || Object.keys(profileData).length === 0) {
      return { success: false, error: "No data provided for update" };
    }

    try {

      const response = await API.put(USER_API_ROUTES.COMMUNITY_PROFILE, profileData);


      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);
        return {
          success: true,
          data: transformedData,
          message: response.data.message || "Community profile updated successfully",
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to update community profile"
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error('API: Update community profile failed:', axiosError);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to update community profile",
      };
    }
  },

  // Upload banner image
  uploadBannerImage: async (file: File): Promise<{
    success: boolean;
    data?: CommunityProfile;
    error?: string;
    message?: string;
  }> => {
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    try {

      const formData = new FormData();
      formData.append("bannerImage", file);

      const response = await API.post(USER_API_ROUTES.COMMUNITY_UPLOAD_BANNER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });


      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);
        return {
          success: true,
          data: transformedData,
          message: response.data.message || "Banner image uploaded successfully",
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to upload banner image"
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error('API: Upload banner image failed:', axiosError);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to upload banner image",
      };
    }
  },

  // Chat API methods
  // Send message
  sendMessage: async (receiverUsername: string, content: string): Promise<SendMessageResponse> => {
    if (!receiverUsername || !content?.trim()) {
      throw new Error("Receiver username and content are required");
    }

    try {

      const response = await API.post(USER_API_ROUTES.CHAT_SEND, {
        receiverUsername: receiverUsername.trim(),
        content: content.trim()
      });


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to send message");
    } catch (error) {
      console.error('API: Send message failed:', error);
      handleApiError(error as AxiosError, "Failed to send message");
      throw error;
    }
  },

  // Get conversations
  getConversations: async (cursor?: string, limit: number = 20, search?: string): Promise<ConversationListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      if (search && search.trim()) params.append('search', search.trim());

      const response = await API.get(`${USER_API_ROUTES.CHAT_CONVERSATIONS}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get conversations");
    } catch (error) {
      console.error('API: Get conversations failed:', error);
      handleApiError(error as AxiosError, "Failed to get conversations");
      throw error;
    }
  },

  // Get conversation messages
  getConversationMessages: async (conversationId: string, cursor?: string, limit: number = 20): Promise<MessageListResponse> => {
    if (!conversationId?.trim()) {
      throw new Error("Conversation ID is required");
    }

    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString());


      const response = await API.get(`${USER_API_ROUTES.CHAT_CONVERSATION_MESSAGES(conversationId)}?${params.toString()}`);


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get messages");
    } catch (error) {
      console.error('API: Get conversation messages failed:', error);
      handleApiError(error as AxiosError, "Failed to get messages");
      throw error;
    }
  },

  // Get or create conversation
  getOrCreateConversation: async (username: string): Promise<ConversationResponse> => {
    if (!username?.trim()) {
      throw new Error("Username is required");
    }

    try {
      const cleanUsername = username.trim();


      const response = await API.get(USER_API_ROUTES.CHAT_CONVERSATION_BY_USERNAME(cleanUsername));


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get or create conversation");
    } catch (error) {
      console.error('API: Get or create conversation failed:', error);
      handleApiError(error as AxiosError, "Failed to get or create conversation");
      throw error;
    }
  },

  // Edit message
  editMessage: async (messageId: string, content: string): Promise<MessageResponse> => {
    if (!messageId?.trim() || !content?.trim()) {
      throw new Error("Message ID and content are required");
    }

    try {

      const response = await API.put(USER_API_ROUTES.CHAT_MESSAGE_BY_ID(messageId), {
        content: content.trim()
      });


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to edit message");
    } catch (error) {
      console.error('API: Edit message failed:', error);
      handleApiError(error as AxiosError, "Failed to edit message");
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    if (!messageId?.trim()) {
      throw new Error("Message ID is required");
    }

    try {

      const response = await API.delete(USER_API_ROUTES.CHAT_MESSAGE_BY_ID(messageId));


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete message");
    } catch (error) {
      console.error('API: Delete message failed:', error);
      handleApiError(error as AxiosError, "Failed to delete message");
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    if (!conversationId?.trim()) {
      throw new Error("Conversation ID is required");
    }

    try {

      const response = await API.post(USER_API_ROUTES.CHAT_MESSAGES_READ, {
        conversationId: conversationId.trim()
      });


      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to mark messages as read");
    } catch (error) {
      console.error('API: Mark messages as read failed:', error);
      handleApiError(error as AxiosError, "Failed to mark messages as read");
      throw error;
    }
  },

  // Helper function to format stats for display
  formatStats: (count: number): string => {
    if (typeof count !== 'number' || count < 0) return '0';

    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  },

  // Helper function to validate website URL
  isValidWebsiteUrl: (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;

    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  // Helper function to clean website URL
  cleanWebsiteUrl: (url: string): string => {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    return 'https://' + trimmed;
  },

  // Helper function to format timestamp
  formatTimestamp: (date: Date | string): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = (now.getTime() - messageDate.getTime()) / 1000;

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  },

  // Notifications System
  getNotifications: async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (unreadOnly) params.append('unreadOnly', 'true');

      const response = await API.get(`${USER_API_ROUTES.NOTIFICATIONS_SYSTEM.BASE}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data?.error || "Failed to fetch notifications");
    } catch (error) {
      console.error('API: Get notifications failed:', error);
      handleApiError(error as AxiosError, "Failed to get notifications");
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await API.put(USER_API_ROUTES.NOTIFICATIONS_SYSTEM.MARK_READ(notificationId));
      if (response.data?.success) return true;
      throw new Error(response.data?.error || "Failed");
    } catch (error) {
      console.error('API: Mark notification read failed:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await API.patch(USER_API_ROUTES.NOTIFICATIONS_SYSTEM.MARK_ALL_READ);
      if (response.data?.success) return true;
      throw new Error(response.data?.error || "Failed");
    } catch (error) {
      console.error('API: Mark all read failed:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await API.delete(USER_API_ROUTES.NOTIFICATIONS_SYSTEM.DELETE(notificationId));
      if (response.data?.success) return true;
      throw new Error(response.data?.error || "Failed");
    } catch (error) {
      console.error('API: Delete notification failed:', error);
      throw error;
    }
  }
};
