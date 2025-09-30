import API from "@/lib/api-client";

export interface CommunityProfile {
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
  joinDate: Date | string;
  isOwnProfile: boolean;
  isFollowing?: boolean;
}

export interface UserFollowInfo {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
  bio: string;
  isFollowing: boolean;
  followedAt?: Date;
}

export interface FollowListResponse {
  users: UserFollowInfo[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface UpdateCommunityProfileData {
  bio?: string;
  location?: string;
  website?: string;
  bannerImage?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  settings?: {
    isProfilePublic?: boolean;
    allowDirectMessages?: boolean;
    showFollowersCount?: boolean;
    showFollowingCount?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors consistently
const handleApiError = (error: any, defaultMessage: string) => {
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
  
  if (error.response?.status >= 500) {
    throw new Error("Server error. Please try again later");
  }
  
  const errorMessage = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to transform profile data with better error handling
const transformProfileData = (data: any): CommunityProfile => {
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
      console.log('API: Fetching own community profile...');
      const response = await API.get("/api/user/community/profile");
      console.log('API: Profile response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);
        console.log('API: Transformed profile data:', transformedData);
        return { data: transformedData };
      }
      
      throw new Error(response.data?.error || response.data?.message || "No profile data received");
    } catch (error: any) {
      console.error('API: Get community profile failed:', error);
      handleApiError(error, "Failed to fetch community profile");
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
      console.log(`API: Fetching profile for username: ${cleanUsername}`);
      
      const response = await API.get(`/api/user/community/profile/username/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Profile response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        const transformedData = transformProfileData(response.data.data);
        console.log(`API: Transformed profile data for ${cleanUsername}:`, transformedData);
        return { data: transformedData };
      }
      
      throw new Error(response.data?.error || response.data?.message || "Profile not found");
    } catch (error: any) {
      console.error(`API: Get profile by username failed for ${username}:`, error);
      handleApiError(error, "Failed to fetch community profile");
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
      console.log(`API: Following user: ${cleanUsername}`);
      
      const response = await API.post("/api/user/community/follow", { username: cleanUsername });
      console.log(`API: Follow response for ${cleanUsername}:`, response.data);
      
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
      throw new Error("Valid username is required");
    }

    try {
      const cleanUsername = username.trim();
      console.log(`API: Unfollowing user: ${cleanUsername}`);
      
      const response = await API.post("/api/user/community/unfollow", { username: cleanUsername });
      console.log(`API: Unfollow response for ${cleanUsername}:`, response.data);
      
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

  // Get followers
  getFollowers: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      
      console.log('API: Fetching followers with params:', params.toString());
      const response = await API.get(`/api/user/community/followers?${params.toString()}`);
      console.log('API: Followers response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get followers");
    } catch (error: any) {
      console.error('API: Get followers failed:', error);
      handleApiError(error, "Failed to get followers");
      throw error;
    }
  },

  // Get following
  getFollowing: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());
      
      console.log('API: Fetching following with params:', params.toString());
      const response = await API.get(`/api/user/community/following?${params.toString()}`);
      console.log('API: Following response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get following");
    } catch (error: any) {
      console.error('API: Get following failed:', error);
      handleApiError(error, "Failed to get following");
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
      
      console.log(`API: Fetching followers for ${cleanUsername} with params:`, params.toString());
      const response = await API.get(`/api/user/community/user/${encodeURIComponent(cleanUsername)}/followers?${params.toString()}`);
      console.log(`API: User followers response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get user followers");
    } catch (error: any) {
      console.error(`API: Get user followers failed for ${username}:`, error);
      handleApiError(error, "Failed to get user followers");
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
      
      console.log(`API: Fetching following for ${cleanUsername} with params:`, params.toString());
      const response = await API.get(`/api/user/community/user/${encodeURIComponent(cleanUsername)}/following?${params.toString()}`);
      console.log(`API: User following response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get user following");
    } catch (error: any) {
      console.error(`API: Get user following failed for ${username}:`, error);
      handleApiError(error, "Failed to get user following");
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
      console.log(`API: Getting follow status for: ${cleanUsername}`);
      
      const response = await API.get(`/api/user/community/follow-status/${encodeURIComponent(cleanUsername)}`);
      console.log(`API: Follow status response for ${cleanUsername}:`, response.data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error || response.data?.message || "Failed to get follow status");
    } catch (error: any) {
      console.error(`API: Get follow status failed for ${username}:`, error);
      handleApiError(error, "Failed to get follow status");
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
      console.log('API: Updating community profile with data:', profileData);
      const response = await API.put("/api/user/community/profile", profileData);
      console.log('API: Update profile response:', response.data);
      
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
    } catch (error: any) {
      console.error('API: Update community profile failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update community profile",
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
      console.log('API: Uploading banner image:', file.name, file.size);
      const formData = new FormData();
      formData.append("bannerImage", file);

      const response = await API.post("/api/user/community/upload-banner-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log('API: Upload banner response:', response.data);

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
    } catch (error: any) {
      console.error('API: Upload banner image failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to upload banner image",
      };
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
  }
};