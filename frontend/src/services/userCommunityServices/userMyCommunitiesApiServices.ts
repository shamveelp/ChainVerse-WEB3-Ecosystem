import API from "@/lib/api-client";

// My Communities interfaces
export interface MyCommunity {
  _id: string;
  communityName: string;
  username: string;
  description: string;
  category: string;
  logo: string;
  banner?: string;
  isVerified: boolean;
  memberCount: number;
  memberRole: string;
  joinedAt: Date;
  lastActiveAt?: Date;
  unreadPosts: number;
  totalPosts: number;
  isActive: boolean;
  settings: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  notifications: boolean;
  createdAt: Date;
}

export interface MyCommunitiesStats {
  totalCommunities: number;
  adminCommunities: number;
  moderatorCommunities: number;
  memberCommunities: number;
}

export interface CommunityActivity {
  communityId: string;
  communityName: string;
  username: string;
  logo: string;
  lastActiveAt: Date;
  unreadPosts: number;
  recentActivity: string;
}

export interface MyCommunitiesResponse {
  communities: MyCommunity[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  stats: MyCommunitiesStats;
}

export interface MyCommunitiesActivityResponse {
  activities: CommunityActivity[];
  totalUnreadPosts: number;
  mostActiveToday: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("My Communities API Error:", {
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

  if (error.response?.status >= 500) {
    throw new Error("Server error. Please try again later");
  }

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to transform community data
const transformMyCommunityData = (data: any): MyCommunity => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid community data received');
  }

  return {
    _id: data._id || '',
    communityName: data.communityName || '',
    username: data.username || '',
    description: data.description || '',
    category: data.category || '',
    logo: data.logo || '',
    banner: data.banner || '',
    isVerified: Boolean(data.isVerified),
    memberCount: Number(data.memberCount) || 0,
    memberRole: data.memberRole || 'member',
    joinedAt: new Date(data.joinedAt),
    lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : undefined,
    unreadPosts: Number(data.unreadPosts) || 0,
    totalPosts: Number(data.totalPosts) || 0,
    isActive: Boolean(data.isActive),
    settings: {
      allowChainCast: data.settings?.allowChainCast || false,
      allowGroupChat: data.settings?.allowGroupChat || true,
      allowPosts: data.settings?.allowPosts || true,
      allowQuests: data.settings?.allowQuests || false
    },
    notifications: Boolean(data.notifications),
    createdAt: new Date(data.createdAt || Date.now())
  };
};

export const userMyCommunitiesApiService = {
  // Get my communities
  getMyCommunities: async (
    filter: string = 'all',
    sortBy: string = 'recent',
    cursor?: string,
    limit: number = 20
  ): Promise<MyCommunitiesResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('filter', filter);
      params.append('sortBy', sortBy);
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      
      const response = await API.get(`/api/user/my-communities?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;

        // Transform communities
        const communities = (data.communities || []).map(transformMyCommunityData);

        return {
          communities,
          hasMore: Boolean(data.hasMore),
          nextCursor: data.nextCursor,
          totalCount: Number(data.totalCount) || 0,
          stats: {
            totalCommunities: Number(data.stats?.totalCommunities) || 0,
            adminCommunities: Number(data.stats?.adminCommunities) || 0,
            moderatorCommunities: Number(data.stats?.moderatorCommunities) || 0,
            memberCommunities: Number(data.stats?.memberCommunities) || 0
          }
        };
      }

      throw new Error(response.data?.error || response.data?.message || "No communities found");
    } catch (error: any) {
      console.error('API: Get my communities failed:', error);
      handleApiError(error, "Failed to get my communities");
      throw error;
    }
  },

  // Get my communities stats
  getMyCommunitiesStats: async (): Promise<MyCommunitiesStats> => {
    try {
      
      const response = await API.get('/api/user/my-communities/stats');
      

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        return {
          totalCommunities: Number(data.totalCommunities) || 0,
          adminCommunities: Number(data.adminCommunities) || 0,
          moderatorCommunities: Number(data.moderatorCommunities) || 0,
          memberCommunities: Number(data.memberCommunities) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get communities stats");
    } catch (error: any) {
      console.error('API: Get communities stats failed:', error);
      handleApiError(error, "Failed to get communities stats");
      throw error;
    }
  },

  // Get my communities activity
  getMyCommunitiesActivity: async (): Promise<MyCommunitiesActivityResponse> => {
    try {
      
      const response = await API.get('/api/user/my-communities/activity');
      

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        return {
          activities: (data.activities || []).map((activity: any) => ({
            communityId: activity.communityId || '',
            communityName: activity.communityName || '',
            username: activity.username || '',
            logo: activity.logo || '',
            lastActiveAt: new Date(activity.lastActiveAt),
            unreadPosts: Number(activity.unreadPosts) || 0,
            recentActivity: activity.recentActivity || 'No recent activity'
          })),
          totalUnreadPosts: Number(data.totalUnreadPosts) || 0,
          mostActiveToday: data.mostActiveToday || []
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get communities activity");
    } catch (error: any) {
      console.error('API: Get communities activity failed:', error);
      handleApiError(error, "Failed to get communities activity");
      throw error;
    }
  },

  // Update community notifications
  updateCommunityNotifications: async (communityId: string, enabled: boolean): Promise<boolean> => {
    if (!communityId || typeof communityId !== 'string' || communityId.trim() === '') {
      throw new Error("Community ID is required");
    }

    try {
      const cleanId = communityId.trim();
      

      const response = await API.put(`/api/user/my-communities/${encodeURIComponent(cleanId)}/notifications`, {
        communityId: cleanId,
        enabled
      });
      

      if (response.data?.success && response.data?.data) {
        return Boolean(response.data.data.notificationsEnabled);
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update notifications");
    } catch (error: any) {
      console.error(`API: Update notifications failed for ${communityId}:`, error);
      handleApiError(error, "Failed to update notifications");
      throw error;
    }
  },

  // Leave community from my communities
  leaveCommunityFromMy: async (communityId: string): Promise<{ success: boolean; message: string }> => {
    if (!communityId || typeof communityId !== 'string' || communityId.trim() === '') {
      throw new Error("Community ID is required");
    }

    try {
      const cleanId = communityId.trim();
      

      const response = await API.delete(`/api/user/my-communities/${encodeURIComponent(cleanId)}/leave`);
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to leave community");
    } catch (error: any) {
      console.error(`API: Leave community failed for ${communityId}:`, error);
      handleApiError(error, "Failed to leave community");
      throw error;
    }
  },

  // Helper functions
  formatMemberCount: (count: number): string => {
    if (typeof count !== 'number' || count < 0) return '0';

    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  },

  formatDate: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatDateLong: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
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
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return userMyCommunitiesApiService.formatDate(date);
    }
  },

  getCommunityAvatarFallback: (communityName: string): string => {
    return communityName?.split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';
  },

  getRoleBadgeColor: (role: string): { bg: string; text: string; border: string } => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'moderator':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      default:
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    }
  }
};