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

export const communityApiService = {
  // Get own community profile
  getCommunityProfile: async (): Promise<{ data: CommunityProfile }> => {
    try {
      console.log("Fetching community profile...");
      const response = await API.get("/api/user/community/profile");
      console.log("Community Profile API response:", response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          data: {
            _id: data._id,
            username: data.username,
            name: data.name || "",
            email: data.email,
            profilePic: data.profilePic || "",
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            bannerImage: data.bannerImage || "",
            isVerified: data.isVerified || false,
            postsCount: data.postsCount || 0,
            likesReceived: data.likesReceived || 0,
            socialLinks: {
              twitter: data.socialLinks?.twitter || "",
              instagram: data.socialLinks?.instagram || "",
              linkedin: data.socialLinks?.linkedin || "",
              github: data.socialLinks?.github || ""
            },
            settings: {
              isProfilePublic: data.settings?.isProfilePublic ?? true,
              allowDirectMessages: data.settings?.allowDirectMessages ?? true,
              showFollowersCount: data.settings?.showFollowersCount ?? true,
              showFollowingCount: data.settings?.showFollowingCount ?? true
            },
            joinDate: data.joinDate || new Date().toISOString(),
            isOwnProfile: data.isOwnProfile || false,
            isFollowing: data.isFollowing || false
          },
        };
      }
      throw new Error(response.data.error || "Failed to fetch community profile");
    } catch (error: any) {
      console.error("Get community profile error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "Failed to fetch community profile";
      
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      
      if (error.response?.status === 403) {
        throw new Error("Profile is private");
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get community profile by username
  getCommunityProfileByUsername: async (username: string): Promise<{ data: CommunityProfile }> => {
    try {
      console.log("Fetching community profile by username:", username);
      const response = await API.get(`/api/user/community/profile/username/${username}`);
      console.log("Community Profile by username API response:", response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          data: {
            _id: data._id,
            username: data.username,
            name: data.name || "",
            email: data.email,
            profilePic: data.profilePic || "",
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            bannerImage: data.bannerImage || "",
            isVerified: data.isVerified || false,
            postsCount: data.postsCount || 0,
            likesReceived: data.likesReceived || 0,
            socialLinks: {
              twitter: data.socialLinks?.twitter || "",
              instagram: data.socialLinks?.instagram || "",
              linkedin: data.socialLinks?.linkedin || "",
              github: data.socialLinks?.github || ""
            },
            settings: {
              isProfilePublic: data.settings?.isProfilePublic ?? true,
              allowDirectMessages: data.settings?.allowDirectMessages ?? true,
              showFollowersCount: data.settings?.showFollowersCount ?? true,
              showFollowingCount: data.settings?.showFollowingCount ?? true
            },
            joinDate: data.joinDate || new Date().toISOString(),
            isOwnProfile: data.isOwnProfile || false,
            isFollowing: data.isFollowing || false
          },
        };
      }
      throw new Error(response.data.error || "Failed to fetch community profile");
    } catch (error: any) {
      console.error("Get community profile by username error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "Failed to fetch community profile";
      
      if (error.response?.status === 404) {
        throw new Error("User not found");
      }
      
      if (error.response?.status === 403) {
        throw new Error("Profile is private");
      }
      
      throw new Error(errorMessage);
    }
  },

  // Follow user
  followUser: async (username: string): Promise<FollowResponse> => {
    try {
      console.log("Following user:", username);
      const response = await API.post("/api/user/community/follow", { username });
      console.log("Follow user API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to follow user");
    } catch (error: any) {
      console.error("Follow user error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to follow user");
    }
  },

  // Unfollow user
  unfollowUser: async (username: string): Promise<FollowResponse> => {
    try {
      console.log("Unfollowing user:", username);
      const response = await API.post("/api/user/community/unfollow", { username });
      console.log("Unfollow user API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to unfollow user");
    } catch (error: any) {
      console.error("Unfollow user error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to unfollow user");
    }
  },

  // Get followers
  getFollowers: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      console.log("Getting followers...");
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());
      
      const response = await API.get(`/api/user/community/followers?${params.toString()}`);
      console.log("Get followers API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to get followers");
    } catch (error: any) {
      console.error("Get followers error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to get followers");
    }
  },

  // Get following
  getFollowing: async (cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      console.log("Getting following...");
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());
      
      const response = await API.get(`/api/user/community/following?${params.toString()}`);
      console.log("Get following API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to get following");
    } catch (error: any) {
      console.error("Get following error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to get following");
    }
  },

  // Get user followers by username
  getUserFollowers: async (username: string, cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      console.log("Getting user followers for:", username);
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());
      
      const response = await API.get(`/api/user/community/user/${username}/followers?${params.toString()}`);
      console.log("Get user followers API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to get user followers");
    } catch (error: any) {
      console.error("Get user followers error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to get user followers");
    }
  },

  // Get user following by username
  getUserFollowing: async (username: string, cursor?: string, limit: number = 20): Promise<FollowListResponse> => {
    try {
      console.log("Getting user following for:", username);
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());
      
      const response = await API.get(`/api/user/community/user/${username}/following?${params.toString()}`);
      console.log("Get user following API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to get user following");
    } catch (error: any) {
      console.error("Get user following error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to get user following");
    }
  },

  // Get follow status
  getFollowStatus: async (username: string): Promise<{ isFollowing: boolean }> => {
    try {
      console.log("Getting follow status for:", username);
      const response = await API.get(`/api/user/community/follow-status/${username}`);
      console.log("Get follow status API response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || "Failed to get follow status");
    } catch (error: any) {
      console.error("Get follow status error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || "Failed to get follow status");
    }
  },

  // Update community profile
  updateCommunityProfile: async (profileData: UpdateCommunityProfileData): Promise<{
    success: boolean;
    data?: CommunityProfile;
    error?: string;
    message?: string;
  }> => {
    try {
      console.log("Updating community profile...", profileData);
      const response = await API.put("/api/user/community/profile", profileData);
      console.log("Update community profile API response:", response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            _id: data._id,
            username: data.username,
            name: data.name || "",
            email: data.email,
            profilePic: data.profilePic || "",
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            bannerImage: data.bannerImage || "",
            isVerified: data.isVerified || false,
            postsCount: data.postsCount || 0,
            likesReceived: data.likesReceived || 0,
            socialLinks: {
              twitter: data.socialLinks?.twitter || "",
              instagram: data.socialLinks?.instagram || "",
              linkedin: data.socialLinks?.linkedin || "",
              github: data.socialLinks?.github || ""
            },
            settings: {
              isProfilePublic: data.settings?.isProfilePublic ?? true,
              allowDirectMessages: data.settings?.allowDirectMessages ?? true,
              showFollowersCount: data.settings?.showFollowersCount ?? true,
              showFollowingCount: data.settings?.showFollowingCount ?? true
            },
            joinDate: data.joinDate || new Date().toISOString(),
            isOwnProfile: data.isOwnProfile || false,
            isFollowing: data.isFollowing || false
          },
          message: response.data.message || "Community profile updated successfully",
        };
      }
      return { 
        success: false, 
        error: response.data.error || "Failed to update community profile" 
      };
    } catch (error: any) {
      console.error("Update community profile error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to update community profile",
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
    try {
      const formData = new FormData();
      formData.append("bannerImage", file);

      console.log("Uploading banner image...");
      const response = await API.post("/api/user/community/upload-banner-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload banner image API response:", response.data);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            _id: data._id,
            username: data.username,
            name: data.name || "",
            email: data.email,
            profilePic: data.profilePic || "",
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            bannerImage: data.bannerImage || "",
            isVerified: data.isVerified || false,
            postsCount: data.postsCount || 0,
            likesReceived: data.likesReceived || 0,
            socialLinks: {
              twitter: data.socialLinks?.twitter || "",
              instagram: data.socialLinks?.instagram || "",
              linkedin: data.socialLinks?.linkedin || "",
              github: data.socialLinks?.github || ""
            },
            settings: {
              isProfilePublic: data.settings?.isProfilePublic ?? true,
              allowDirectMessages: data.settings?.allowDirectMessages ?? true,
              showFollowersCount: data.settings?.showFollowersCount ?? true,
              showFollowingCount: data.settings?.showFollowingCount ?? true
            },
            joinDate: data.joinDate || new Date().toISOString(),
            isOwnProfile: data.isOwnProfile || false,
            isFollowing: data.isFollowing || false
          },
          message: response.data.message || "Banner image uploaded successfully",
        };
      }
      return { 
        success: false, 
        error: response.data.error || "Failed to upload banner image" 
      };
    } catch (error: any) {
      console.error("Upload banner image error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to upload banner image",
      };
    }
  },

  // Helper function to format stats for display
  formatStats: (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  },

  // Helper function to validate website URL
  isValidWebsiteUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  // Helper function to clean website URL
  cleanWebsiteUrl: (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }
};