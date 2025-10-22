import API from "@/lib/api-client";

// Community interfaces
export interface Community {
  _id: string;
  communityName: string;
  username: string;
  description: string;
  category: string;
  logo: string;
  banner?: string;
  isVerified: boolean;
  memberCount: number;
  isMember: boolean;
  createdAt: Date | string;
  rules?: string[];
  socialLinks?: any[];
  settings?: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  memberRole?: string;
  isAdmin?: boolean;
}

export interface CommunityProfile extends Community {
  banner: string;
  rules: string[];
  socialLinks: any[];
  settings: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  memberRole?: string;
  isAdmin: boolean;
}

export interface CommunityMember {
  _id: string;
  user: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
  };
  role: string;
  joinedAt: Date;
  isActive: boolean;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
}

export interface UserSearchResult {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  bio: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing?: boolean;
}

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
  followersCount: number;
  followingCount: number;
  bio: string;
  location: string;
  website: string;
  bannerImage: string;
  isVerified: boolean;
  postsCount: number;
  likesReceived: number;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  settings: {
    isProfilePublic: boolean;
    allowDirectMessages: boolean;
    showFollowersCount: boolean;
    showFollowingCount: boolean;
  };
  joinDate: Date;
  isOwnProfile: boolean;
  isFollowing?: boolean;
}

export interface SearchResponse {
  communities: Community[];
  users: UserSearchResult[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  searchType: string;
}

export interface CommunityListResponse {
  communities: Community[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface CommunityMemberListResponse {
  members: CommunityMember[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface JoinCommunityResponse {
  success: boolean;
  message: string;
  isMember: boolean;
  memberCount: number;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
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

// Helper function to transform community data
const transformCommunityData = (data: any): Community => {
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
    isMember: Boolean(data.isMember),
    createdAt: data.createdAt || new Date().toISOString(),
    rules: data.rules || [],
    socialLinks: data.socialLinks || [],
    settings: {
      allowChainCast: data.settings?.allowChainCast || false,
      allowGroupChat: data.settings?.allowGroupChat || true,
      allowPosts: data.settings?.allowPosts || true,
      allowQuests: data.settings?.allowQuests || false
    },
    memberRole: data.memberRole,
    isAdmin: Boolean(data.isAdmin)
  };
};

// Helper function to transform user data
const transformUserData = (data: any): UserProfile => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data received');
  }

  return {
    _id: data._id || '',
    username: data.username || '',
    name: data.name || '',
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
      isProfilePublic: data.settings?.isProfilePublic !== false,
      allowDirectMessages: data.settings?.allowDirectMessages !== false,
      showFollowersCount: data.settings?.showFollowersCount !== false,
      showFollowingCount: data.settings?.showFollowingCount !== false
    },
    joinDate: new Date(data.joinDate || data.createdAt || Date.now()),
    isOwnProfile: Boolean(data.isOwnProfile),
    isFollowing: Boolean(data.isFollowing)
  };
};

export const communityExploreApiService = {
  // Search communities and users
  search: async (
    query: string,
    type: string = 'all',
    cursor?: string,
    limit: number = 20
  ): Promise<SearchResponse> => {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error("Search query is required");
    }

    try {
      const params = new URLSearchParams();
      params.append('query', query.trim());
      params.append('type', type);
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      console.log('API: Searching with params:', params.toString());
      const response = await API.get(`/api/user/communities/search?${params.toString()}`);
      console.log('API: Search response:', response.data);

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;

        // Transform communities
        const communities = (data.communities || []).map(transformCommunityData);

        // Transform users
        const users = (data.users || []).map((user: any) => ({
          _id: user._id || '',
          username: user.username || '',
          name: user.name || user.username || '',
          profilePic: user.profilePic || '',
          bio: user.bio || '',
          isVerified: Boolean(user.isVerified),
          followersCount: Number(user.followersCount) || 0,
          isFollowing: Boolean(user.isFollowing)
        }));

        return {
          communities,
          users,
          hasMore: Boolean(data.hasMore),
          nextCursor: data.nextCursor,
          totalCount: Number(data.totalCount) || 0,
          searchType: data.searchType || type
        };
      }

      throw new Error(response.data?.error || response.data?.message || "No search results");
    } catch (error: any) {
      console.error('API: Search failed:', error);
      handleApiError(error, "Failed to search");
      throw error;
    }
  },

  // Get popular communities
  getPopularCommunities: async (
    cursor?: string,
    limit: number = 20,
    category?: string
  ): Promise<CommunityListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      if (category && category.trim()) params.append('category', category.trim());

      console.log('API: Getting popular communities with params:', params.toString());
      const response = await API.get(`/api/user/communities/popular?${params.toString()}`);
      console.log('API: Popular communities response:', response.data);

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const communities = (data.communities || []).map(transformCommunityData);

        return {
          communities,
          hasMore: Boolean(data.hasMore),
          nextCursor: data.nextCursor,
          totalCount: Number(data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get popular communities");
    } catch (error: any) {
      console.error('API: Get popular communities failed:', error);
      handleApiError(error, "Failed to get popular communities");
      throw error;
    }
  },

  // Get community profile by username
  getCommunityProfile: async (username: string): Promise<CommunityProfile> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Community username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Getting community profile for: ${cleanUsername}`);

      const response = await API.get(`/api/user/communities/username/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Community profile response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return transformCommunityData(response.data.data) as CommunityProfile;
      }

      throw new Error(response.data?.error || response.data?.message || "Community not found");
    } catch (error: any) {
      console.error(`API: Get community profile failed for ${username}:`, error);
      handleApiError(error, "Failed to get community profile");
      throw error;
    }
  },

  // Get community profile by ID
  getCommunityById: async (communityId: string): Promise<CommunityProfile> => {
    if (!communityId || typeof communityId !== 'string' || communityId.trim() === '') {
      throw new Error("Community ID is required");
    }

    try {
      const cleanId = communityId.trim();
      console.log(`API: Getting community by ID: ${cleanId}`);

      const response = await API.get(`/api/user/communities/${encodeURIComponent(cleanId)}`);
      console.log(`API: Community by ID response for ${cleanId}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return transformCommunityData(response.data.data) as CommunityProfile;
      }

      throw new Error(response.data?.error || response.data?.message || "Community not found");
    } catch (error: any) {
      console.error(`API: Get community by ID failed for ${communityId}:`, error);
      handleApiError(error, "Failed to get community");
      throw error;
    }
  },

  // Get user profile by username
  getUserProfile: async (username: string): Promise<UserProfile> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Getting user profile for: ${cleanUsername}`);

      const response = await API.get(`/api/user/community/profile/username/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: User profile response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return transformUserData(response.data.data);
      }

      throw new Error(response.data?.error || response.data?.message || "User not found");
    } catch (error: any) {
      console.error(`API: Get user profile failed for ${username}:`, error);
      handleApiError(error, "Failed to get user profile");
      throw error;
    }
  },

  // Join community
  joinCommunity: async (communityUsername: string): Promise<JoinCommunityResponse> => {
    if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
      throw new Error("Community username is required");
    }

    try {
      const cleanUsername = communityUsername.trim();
      console.log(`API: Joining community: ${cleanUsername}`);

      const response = await API.post("/api/user/communities/join", {
        communityUsername: cleanUsername
      });
      console.log(`API: Join community response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to join community");
    } catch (error: any) {
      console.error(`API: Join community failed for ${communityUsername}:`, error);
      handleApiError(error, "Failed to join community");
      throw error;
    }
  },

  // Leave community
  leaveCommunity: async (communityUsername: string): Promise<JoinCommunityResponse> => {
    if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
      throw new Error("Community username is required");
    }

    try {
      const cleanUsername = communityUsername.trim();
      console.log(`API: Leaving community: ${cleanUsername}`);

      const response = await API.post("/api/user/communities/leave", {
        communityUsername: cleanUsername
      });
      console.log(`API: Leave community response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to leave community");
    } catch (error: any) {
      console.error(`API: Leave community failed for ${communityUsername}:`, error);
      handleApiError(error, "Failed to leave community");
      throw error;
    }
  },

  // Get community members
  getCommunityMembers: async (
    communityUsername: string,
    cursor?: string,
    limit: number = 20
  ): Promise<CommunityMemberListResponse> => {
    if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
      throw new Error("Community username is required");
    }

    try {
      const cleanUsername = communityUsername.trim();
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      console.log(`API: Getting members for community: ${cleanUsername}`);
      const response = await API.get(`/api/user/communities/${encodeURIComponent(cleanUsername)}/members?${params.toString()}`);
      console.log(`API: Community members response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get community members");
    } catch (error: any) {
      console.error(`API: Get community members failed for ${communityUsername}:`, error);
      handleApiError(error, "Failed to get community members");
      throw error;
    }
  },

  // Get community member status
  getCommunityMemberStatus: async (communityUsername: string): Promise<{
    isMember: boolean;
    role?: string;
    joinedAt?: Date;
  }> => {
    if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
      throw new Error("Community username is required");
    }

    try {
      const cleanUsername = communityUsername.trim();
      console.log(`API: Getting member status for community: ${cleanUsername}`);

      const response = await API.get(`/api/user/communities/${encodeURIComponent(cleanUsername)}/member-status`);
      console.log(`API: Member status response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to get member status");
    } catch (error: any) {
      console.error(`API: Get member status failed for ${communityUsername}:`, error);
      handleApiError(error, "Failed to get member status");
      throw error;
    }
  },

  // Follow user
  followUser: async (username: string): Promise<FollowResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Following user: ${cleanUsername}`);

      const response = await API.post("/api/user/community/follow", {
        username: cleanUsername
      });
      console.log(`API: Follow user response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to follow user");
    } catch (error: any) {
      console.error(`API: Follow user failed for ${username}:`, error);
      handleApiError(error, "Failed to follow user");
      throw error;
    }
  },

  // Unfollow user
  unfollowUser: async (username: string): Promise<FollowResponse> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Unfollowing user: ${cleanUsername}`);

      const response = await API.post("/api/user/community/unfollow", {
        username: cleanUsername
      });
      console.log(`API: Unfollow user response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to unfollow user");
    } catch (error: any) {
      console.error(`API: Unfollow user failed for ${username}:`, error);
      handleApiError(error, "Failed to unfollow user");
      throw error;
    }
  },

  // Get follow status
  getFollowStatus: async (username: string): Promise<{ isFollowing: boolean }> => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("Username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Getting follow status for: ${cleanUsername}`);

      const response = await API.get(`/api/user/community/follow-status/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Follow status response for ${cleanUsername}:`, response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      return { isFollowing: false };
    } catch (error: any) {
      console.error(`API: Get follow status failed for ${username}:`, error);
      return { isFollowing: false };
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
      month: 'long',
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

  getCommunityAvatarFallback: (communityName: string): string => {
    return communityName?.split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';
  },

  getUserAvatarFallback: (name: string, username: string): string => {
    const displayName = name || username || 'User';
    return displayName.split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
};
