import API from "@/lib/api-client";

// Community interfaces
export interface CommunityProfileData {
  _id: string;
  communityName: string;
  username: string;
  email: string;
  walletAddress: string;
  description: string;
  category: string;
  rules: string[];
  logo: string;
  banner: string;
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  membersCount?: number;
  postsCount?: number;
  communityAdmins: string[];
  settings: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserSearchResult {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  bio: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  type: 'user';
}

export interface CommunitySearchResult {
  _id: string;
  communityName: string;
  username: string;
  description: string;
  category: string;
  logo: string;
  isVerified: boolean;
  membersCount: number;
  postsCount: number;
  status: string;
  isJoined?: boolean;
  type: 'community';
}

export interface ExploreSearchResponse {
  users: UserSearchResult[];
  communities: CommunitySearchResult[];
  totalUsers: number;
  totalCommunities: number;
  hasMoreUsers: boolean;
  hasMoreCommunities: boolean;
  nextUsersCursor?: string;
  nextCommunitiesCursor?: string;
}

export interface TrendingTopicsResponse {
  topics: Array<{
    tag: string;
    posts: string;
    trend: 'trending' | 'hot' | 'rising';
  }>;
}

export interface PopularCommunitiesResponse {
  communities: CommunitySearchResult[];
  totalCount: number;
}

// Helper function to handle API errors consistently
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("Community Explore API Error:", {
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

export const communityExploreApiService = {
  // Search users and communities
  searchExplore: async (
    query: string,
    type: 'all' | 'users' | 'communities' | 'trending' = 'all',
    usersCursor?: string,
    communitiesCursor?: string,
    limit: number = 20
  ): Promise<ExploreSearchResponse> => {
    if (!query?.trim()) {
      throw new Error("Search query is required");
    }

    try {
      const params = new URLSearchParams();
      params.append('query', query.trim());
      params.append('type', type);
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      
      if (usersCursor && usersCursor.trim()) {
        params.append('usersCursor', usersCursor.trim());
      }
      if (communitiesCursor && communitiesCursor.trim()) {
        params.append('communitiesCursor', communitiesCursor.trim());
      }

      console.log('API: Searching explore with params:', params.toString());
      const response = await API.get(`/api/user/community/explore/search?${params.toString()}`);
      console.log('API: Explore search response:', response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Search failed");
    } catch (error: any) {
      console.error('API: Explore search failed:', error);
      handleApiError(error, "Failed to search");
      throw error;
    }
  },

  // Get trending topics
  getTrendingTopics: async (): Promise<TrendingTopicsResponse> => {
    try {
      console.log('API: Fetching trending topics...');
      const response = await API.get('/api/user/community/explore/trending');
      console.log('API: Trending topics response:', response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get trending topics");
    } catch (error: any) {
      console.error('API: Get trending topics failed:', error);
      handleApiError(error, "Failed to get trending topics");
      throw error;
    }
  },

  // Get popular communities
  getPopularCommunities: async (cursor?: string, limit: number = 20): Promise<PopularCommunitiesResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      
      if (cursor && cursor.trim()) {
        params.append('cursor', cursor.trim());
      }

      console.log('API: Fetching popular communities with params:', params.toString());
      const response = await API.get(`/api/user/community/explore/popular-communities?${params.toString()}`);
      console.log('API: Popular communities response:', response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get popular communities");
    } catch (error: any) {
      console.error('API: Get popular communities failed:', error);
      handleApiError(error, "Failed to get popular communities");
      throw error;
    }
  },

  // Get community profile by username
  getCommunityProfile: async (username: string): Promise<{ data: CommunityProfileData }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Fetching community profile for username: ${cleanUsername}`);
      
      const response = await API.get(`/api/user/community/profile/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Community profile response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return { data: response.data.data };
      }
      
      throw new Error(response.data?.error || response.data?.message || "Community profile not found");
    } catch (error: any) {
      console.error(`API: Get community profile failed for ${username}:`, error);
      handleApiError(error, "Failed to fetch community profile");
      throw error;
    }
  },

  // Join community
  joinCommunity: async (username: string): Promise<{ success: boolean; message: string; isJoined: boolean; membersCount: number }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Joining community: ${cleanUsername}`);
      
      const response = await API.post("/api/user/community/join", { username: cleanUsername });
      console.log(`API: Join community response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to join community");
    } catch (error: any) {
      console.error(`API: Join community failed for ${username}:`, error);
      handleApiError(error, "Failed to join community");
      throw error;
    }
  },

  // Leave community
  leaveCommunity: async (username: string): Promise<{ success: boolean; message: string; isJoined: boolean; membersCount: number }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Leaving community: ${cleanUsername}`);
      
      const response = await API.post("/api/user/community/leave", { username: cleanUsername });
      console.log(`API: Leave community response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to leave community");
    } catch (error: any) {
      console.error(`API: Leave community failed for ${username}:`, error);
      handleApiError(error, "Failed to leave community");
      throw error;
    }
  },

  // Get community membership status
  getCommunityMembershipStatus: async (username: string): Promise<{ isJoined: boolean }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Getting membership status for: ${cleanUsername}`);
      
      const response = await API.get(`/api/user/community/membership-status/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Membership status response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get membership status");
    } catch (error: any) {
      console.error(`API: Get membership status failed for ${username}:`, error);
      handleApiError(error, "Failed to get membership status");
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

  // Helper function to format timestamp
  formatTimestamp: (date: Date | string): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = (now.getTime() - targetDate.getTime()) / 1000;

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
      return targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
};