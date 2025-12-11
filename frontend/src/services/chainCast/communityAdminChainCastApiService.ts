import API from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "../../routes/api.routes";

// ChainCast interfaces
export interface ChainCast {
  _id: string;
  communityId: string;
  admin: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  maxParticipants: number;
  currentParticipants: number;
  settings: {
    allowReactions: boolean;
    allowChat: boolean;
    moderationRequired: boolean;
    recordSession: boolean;
  };
  stats: {
    totalViews: number;
    peakViewers: number;
    totalReactions: number;
    averageWatchTime: number;
  };
  canJoin: boolean;
  canModerate: boolean;
  isParticipant: boolean;
  userRole?: 'viewer' | 'moderator' | 'admin';
  streamUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChainCastParticipant {
  _id: string;
  user: {
    _id: string;
    username: string;
    name: string;
    profilePic?: string;
    isVerified: boolean;
  };
  role: 'viewer' | 'moderator' | 'admin';
  joinedAt: Date;
  isActive: boolean;
  permissions: {
    canStream: boolean;
    canModerate: boolean;
    canReact: boolean;
    canChat: boolean;
  };
  streamData: {
    hasVideo: boolean;
    hasAudio: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
  };
  watchTime: number;
  reactionsCount: number;
}

export interface ChainCastModerationRequest {
  _id: string;
  user: {
    _id: string;
    username: string;
    name: string;
    profilePic?: string;
  };
  requestedPermissions: {
    video: boolean;
    audio: boolean;
  };
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewMessage?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ChainCastReaction {
  _id: string;
  user: {
    _id: string;
    username: string;
    name: string;
    profilePic?: string;
  };
  emoji: string;
  timestamp: Date;
}

export interface CreateChainCastRequest {
  title: string;
  description?: string;
  scheduledStartTime?: string;
  maxParticipants?: number;
  settings?: {
    allowReactions?: boolean;
    allowChat?: boolean;
    moderationRequired?: boolean;
    recordSession?: boolean;
  };
}

export interface UpdateChainCastRequest {
  title?: string;
  description?: string;
  scheduledStartTime?: string;
  maxParticipants?: number;
  settings?: {
    allowReactions?: boolean;
    allowChat?: boolean;
    moderationRequired?: boolean;
    recordSession?: boolean;
  };
}

export interface ChainCastsResponse {
  chainCasts: ChainCast[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  summary?: {
    live: number;
    scheduled: number;
    ended: number;
  };
}

export interface ParticipantsResponse {
  participants: ChainCastParticipant[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  activeCount: number;
  moderatorCount: number;
}

export interface ModerationRequestsResponse {
  requests: ChainCastModerationRequest[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  pendingCount: number;
}

export interface ReactionsResponse {
  reactions: ChainCastReaction[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  reactionsSummary: { [emoji: string]: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("Community Admin ChainCast API Error:", {
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

export const communityAdminChainCastApiService = {
  // ChainCast management
  createChainCast: async (data: CreateChainCastRequest): Promise<ChainCast> => {
    try {
      console.log('API: Creating ChainCast:', {
        title: data.title,
        hasDescription: !!data.description,
        scheduledStartTime: data.scheduledStartTime
      });

      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.CREATE, data);

      console.log('API: ChainCast created successfully:', {
        chainCastId: response.data?.data?._id,
        title: response.data?.data?.title,
        status: response.data?.data?.status
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to create ChainCast");
    } catch (error: any) {
      console.error('API: Create ChainCast failed:', error);
      handleApiError(error, "Failed to create ChainCast");
      throw error;
    }
  },

  getChainCasts: async (
    status: string = 'all',
    cursor?: string,
    limit: number = 10,
    sortBy: string = 'recent'
  ): Promise<ChainCastsResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      params.append('sortBy', sortBy);



      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.LIST}?${params.toString()}`);

      console.log('API: ChainCasts fetched successfully:', {
        chainCastCount: response.data?.data?.chainCasts?.length,
        hasMore: response.data?.data?.hasMore,
        totalCount: response.data?.data?.totalCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get ChainCasts");
    } catch (error: any) {
      console.error('API: Get ChainCasts failed:', error);
      handleApiError(error, "Failed to get ChainCasts");
      throw error;
    }
  },

  getChainCast: async (chainCastId: string): Promise<ChainCast> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.get(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.BY_ID(encodeURIComponent(chainCastId.trim())));

      console.log('API: ChainCast fetched successfully:', {
        chainCastId: response.data?.data?._id,
        title: response.data?.data?.title,
        status: response.data?.data?.status
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

  updateChainCast: async (chainCastId: string, data: UpdateChainCastRequest): Promise<ChainCast> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.put(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.BY_ID(encodeURIComponent(chainCastId.trim())), data);

      console.log('API: ChainCast updated successfully:', {
        chainCastId: response.data?.data?._id,
        title: response.data?.data?.title
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update ChainCast");
    } catch (error: any) {
      console.error('API: Update ChainCast failed:', error);
      handleApiError(error, "Failed to update ChainCast");
      throw error;
    }
  },

  deleteChainCast: async (chainCastId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.delete(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.BY_ID(encodeURIComponent(chainCastId.trim())));

      console.log('API: ChainCast deleted successfully:', {
        chainCastId,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete ChainCast");
    } catch (error: any) {
      console.error('API: Delete ChainCast failed:', error);
      handleApiError(error, "Failed to delete ChainCast");
      throw error;
    }
  },

  // ChainCast control
  startChainCast: async (chainCastId: string): Promise<ChainCast> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.START(encodeURIComponent(chainCastId.trim())));

      console.log('API: ChainCast started successfully:', {
        chainCastId: response.data?.data?._id,
        status: response.data?.data?.status,
        streamUrl: response.data?.data?.streamUrl
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to start ChainCast");
    } catch (error: any) {
      console.error('API: Start ChainCast failed:', error);
      handleApiError(error, "Failed to start ChainCast");
      throw error;
    }
  },

  endChainCast: async (chainCastId: string): Promise<ChainCast> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.END(encodeURIComponent(chainCastId.trim())));

      console.log('API: ChainCast ended successfully:', {
        chainCastId: response.data?.data?._id,
        status: response.data?.data?.status
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to end ChainCast");
    } catch (error: any) {
      console.error('API: End ChainCast failed:', error);
      handleApiError(error, "Failed to end ChainCast");
      throw error;
    }
  },

  // Participant management
  getParticipants: async (
    chainCastId: string,
    filter: string = 'all',
    cursor?: string,
    limit: number = 20
  ): Promise<ParticipantsResponse> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }

      const params = new URLSearchParams();
      params.append('filter', filter);
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString());



      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.PARTICIPANTS(encodeURIComponent(chainCastId.trim()))}?${params.toString()}`);

      console.log('API: Participants fetched successfully:', {
        participantCount: response.data?.data?.participants?.length,
        totalCount: response.data?.data?.totalCount,
        activeCount: response.data?.data?.activeCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get participants");
    } catch (error: any) {
      console.error('API: Get participants failed:', error);
      handleApiError(error, "Failed to get participants");
      throw error;
    }
  },

  removeParticipant: async (chainCastId: string, participantId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!chainCastId?.trim() || !participantId?.trim()) {
        throw new Error("ChainCast ID and participant ID are required");
      }



      const response = await API.delete(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.PARTICIPANT_ACTION(encodeURIComponent(chainCastId.trim()), encodeURIComponent(participantId.trim())), {
        data: { reason }
      });

      console.log('API: Participant removed successfully:', {
        chainCastId,
        participantId,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to remove participant");
    } catch (error: any) {
      console.error('API: Remove participant failed:', error);
      handleApiError(error, "Failed to remove participant");
      throw error;
    }
  },

  // Moderation
  getModerationRequests: async (chainCastId: string): Promise<ModerationRequestsResponse> => {
    try {
      if (!chainCastId?.trim()) {
        throw new Error("ChainCast ID is required");
      }



      const response = await API.get(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.MODERATION_REQUESTS(encodeURIComponent(chainCastId.trim())));

      console.log('API: Moderation requests fetched successfully:', {
        requestCount: response.data?.data?.requests?.length,
        pendingCount: response.data?.data?.pendingCount
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get moderation requests");
    } catch (error: any) {
      console.error('API: Get moderation requests failed:', error);
      handleApiError(error, "Failed to get moderation requests");
      throw error;
    }
  },

  reviewModerationRequest: async (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewMessage?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!requestId?.trim()) {
        throw new Error("Request ID is required");
      }



      const response = await API.post(COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.REVIEW_MODERATION, {
        requestId: requestId.trim(),
        status,
        reviewMessage
      });

      console.log('API: Moderation request reviewed successfully:', {
        requestId,
        status,
        success: response.data?.success
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to review moderation request");
    } catch (error: any) {
      console.error('API: Review moderation request failed:', error);
      handleApiError(error, "Failed to review moderation request");
      throw error;
    }
  },

  // Analytics
  getAnalytics: async (period: string = 'week'): Promise<any> => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);



      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.ANALYTICS}?${params.toString()}`);

      console.log('API: Analytics fetched successfully:', {
        period,
        hasData: !!response.data?.data
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get analytics");
    } catch (error: any) {
      console.error('API: Get analytics failed:', error);
      handleApiError(error, "Failed to get analytics");
      throw error;
    }
  },

  // Reactions
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



      const response = await API.get(`${COMMUNITY_ADMIN_API_ROUTES.CHAINCAST.REACTIONS(encodeURIComponent(chainCastId.trim()))}?${params.toString()}`);

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

  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  },

  getRoleColor: (role: string): { bg: string; text: string; border: string } => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'moderator':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      default:
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    }
  }
};