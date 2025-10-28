import API from "@/lib/api-client";

// Re-export types from communityAdminChainCastApiService
export type {
  ChainCast,
  ChainCastsResponse,
  ReactionsResponse,
  ChainCastReaction,
  ChainCastParticipant,
  ChainCastModerationRequest
} from "./communityAdminChainCastApiService";

// User-specific interfaces
export interface JoinChainCastRequest {
  chainCastId: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface UpdateParticipantRequest {
  hasVideo?: boolean;
  hasAudio?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface RequestModerationRequest {
  chainCastId: string;
  requestedPermissions: {
    video: boolean;
    audio: boolean;
  };
  message?: string;
}

export interface AddReactionRequest {
  chainCastId: string;
  emoji: string;
}

export interface JoinChainCastResponse {
  success: boolean;
  message: string;
  streamUrl?: string;
}

export interface CanJoinResponse {
  canJoin: boolean;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Import types for proper typing
import type { ChainCast, ChainCastsResponse, ReactionsResponse } from "./communityAdminChainCastApiService";

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("User ChainCast API Error:", {
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
    throw new Error("ChainCast not found");
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

export const userChainCastApiService = {
  // ChainCast viewing
  getCommunityChainCasts: async (
    communityId: string,
    status: string = 'all',
    cursor?: string,
    limit: number = 10,
    sortBy: string = 'recent'
  ): Promise<ChainCastsResponse> => {
    try {
      if (!communityId?.trim()) {
        throw new Error("Community ID is required");
      }

      const params = new URLSearchParams();
      params.append('status', status);
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      params.append('sortBy', sortBy);

      

      const response = await API.get(`/api/user/community/${encodeURIComponent(communityId.trim())}/chaincasts?${params.toString()}`);

      console.log('API: Community ChainCasts fetched successfully:', {
        chainCastCount: response.data?.data?.chainCasts?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get community ChainCasts");
    } catch (error: any) {
      console.error('API: Get community ChainCasts failed:', error);
      handleApiError(error, "Failed to get community ChainCasts");
      throw error;
    }
  },

  getChainCast: async (chainCastId: string): Promise<ChainCast> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      

      const response = await API.get(`/api/user/chaincast/${encodeURIComponent(chainCastId.trim())}`);

      console.log('API: ChainCast fetched successfully:', {
        chainCastId: response.data?.data?._id,
        title: response.data?.data?.title,
        status: response.data?.data?.status,
        canJoin: response.data?.data?.canJoin
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get ChainCast");
    } catch (error: any) {
      console.error('API: Get ChainCast failed:', error);
      handleApiError(error, "Failed to get ChainCast");
      throw error;
    }
  },

  canJoinChainCast: async (chainCastId: string): Promise<CanJoinResponse> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      

      const response = await API.get(`/api/user/chaincast/${encodeURIComponent(chainCastId.trim())}/can-join`);

      console.log('API: Can join check completed:', {
        chainCastId,
        canJoin: response.data?.data?.canJoin,
        reason: response.data?.data?.reason
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      return { canJoin: false, reason: "Unknown error" };
    } catch (error: any) {
      console.error('API: Can join check failed:', error);
      return { canJoin: false, reason: error.message || "Failed to check join permissions" };
    }
  },

  // Participation
  joinChainCast: async (data: JoinChainCastRequest): Promise<JoinChainCastResponse> => {
    try {
      if (!data.chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      console.log('API: Joining ChainCast:', {
        chainCastId: data.chainCastId,
        quality: data.quality
      });

      const response = await API.post('/api/user/chaincast/join', {
        chainCastId: data.chainCastId.trim(),
        quality: data.quality || 'medium'
      });

      console.log('API: ChainCast joined successfully:', {
        chainCastId: data.chainCastId,
        success: response.data?.success,
        hasStreamUrl: !!response.data?.data?.streamUrl
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to join ChainCast");
    } catch (error: any) {
      console.error('API: Join ChainCast failed:', error);
      handleApiError(error, "Failed to join ChainCast");
      throw error;
    }
  },

  leaveChainCast: async (chainCastId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      

      const response = await API.post(`/api/user/chaincast/${encodeURIComponent(chainCastId.trim())}/leave`);

      console.log('API: ChainCast left successfully:', {
        chainCastId,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to leave ChainCast");
    } catch (error: any) {
      console.error('API: Leave ChainCast failed:', error);
      handleApiError(error, "Failed to leave ChainCast");
      throw error;
    }
  },

  updateParticipant: async (chainCastId: string, data: UpdateParticipantRequest): Promise<{ success: boolean; message: string }> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      

      const response = await API.put(`/api/user/chaincast/${encodeURIComponent(chainCastId.trim())}/participant`, data);

      console.log('API: Participant updated successfully:', {
        chainCastId,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update participant");
    } catch (error: any) {
      console.error('API: Update participant failed:', error);
      handleApiError(error, "Failed to update participant");
      throw error;
    }
  },

  // Moderation
  requestModeration: async (data: RequestModerationRequest): Promise<{ success: boolean; message: string }> => {
    try {
      if (!data.chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      console.log('API: Requesting moderation:', {
        chainCastId: data.chainCastId,
        requestedPermissions: data.requestedPermissions,
        hasMessage: !!data.message
      });

      const response = await API.post('/api/user/chaincast/request-moderation', {
        chainCastId: data.chainCastId.trim(),
        requestedPermissions: data.requestedPermissions,
        message: data.message
      });

      console.log('API: Moderation requested successfully:', {
        chainCastId: data.chainCastId,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to request moderation");
    } catch (error: any) {
      console.error('API: Request moderation failed:', error);
      handleApiError(error, "Failed to request moderation");
      throw error;
    }
  },

  // Reactions
  addReaction: async (data: AddReactionRequest): Promise<{ success: boolean; message: string }> => {
    try {
      if (!data.chainCastId?.trim() || !data.emoji?.trim()) {
        throw new Error("ChainCast ID and emoji are required");
      }

      console.log('API: Adding reaction:', {
        chainCastId: data.chainCastId,
        emoji: data.emoji
      });

      const response = await API.post('/api/user/chaincast/reaction', {
        chainCastId: data.chainCastId.trim(),
        emoji: data.emoji.trim()
      });

      console.log('API: Reaction added successfully:', {
        chainCastId: data.chainCastId,
        emoji: data.emoji,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to add reaction");
    } catch (error: any) {
      console.error('API: Add reaction failed:', error);
      handleApiError(error, "Failed to add reaction");
      throw error;
    }
  },

  getReactions: async (
    chainCastId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<ReactionsResponse> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString());

      

      const response = await API.get(`/api/user/chaincast/${encodeURIComponent(chainCastId.trim())}/reactions?${params.toString()}`);

      console.log('API: Reactions fetched successfully:', {
        reactionCount: response.data?.data?.reactions?.length,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get reactions");
    } catch (error: any) {
      console.error('API: Get reactions failed:', error);
      handleApiError(error, "Failed to get reactions");
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

  formatDateTime: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      return userChainCastApiService.formatDate(date);
    }
  },

  formatViewerCount: (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  },

  getUserAvatarFallback: (name: string): string => {
    return name?.split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  },

  getStatusColor: (status: string): { bg: string; text: string; border: string } => {
    switch (status) {
      case 'live':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      case 'scheduled':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      case 'ended':
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
      case 'cancelled':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  }
};