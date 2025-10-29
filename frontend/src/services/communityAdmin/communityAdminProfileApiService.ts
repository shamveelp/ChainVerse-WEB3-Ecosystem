import api from "@/lib/api-client";

// Types
interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  totalPosts: number;
  totalQuests: number;
  premiumMembers: number;
  engagementRate: number;
  myPostsCount: number; // Added to match the component's interface
  myLikesCount: number; // Added to match the component's interface
  myCommentsCount: number; // Added to match the component's interface
}

interface CommunityAdminProfile {
  _id: string;
  name: string;
  email: string;
  username: string; // Added to match the component's interface
  bio?: string;
  location?: string;
  website?: string;
  profilePic?: string;
  bannerImage?: string; // Added to match the component's interface
  communityId?: string;
  communityName?: string;
  communityLogo?: string;
  isActive: boolean;
  lastLogin?: Date;
  joinDate: Date;
  stats: CommunityStats;
}

interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

class CommunityAdminProfileApiService {
  private readonly baseUrl = '/api/community-admin';

  // Get profile
  async getProfile(): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const response = await api.get(`${this.baseUrl}/profile`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Get community admin profile error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to get profile",
      };
    }
  }

  // Update profile
  async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const response = await api.put(`${this.baseUrl}/profile`, profileData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Update community admin profile error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to update profile",
      };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post(`${this.baseUrl}/profile/upload-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Upload profile picture error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to upload profile picture",
      };
    }
  }

  // Upload banner image
  async uploadBannerImage(file: File): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const formData = new FormData();
      formData.append('bannerImage', file);

      const response = await api.post(`${this.baseUrl}/profile/upload-banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Upload banner image error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to upload banner image",
      };
    }
  }

  // Get community stats
  async getCommunityStats(period: string = 'week'): Promise<ApiResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/community-stats?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get community stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to get community stats",
      };
    }
  }
}

export const communityAdminProfileApiService = new CommunityAdminProfileApiService();
export default communityAdminProfileApiService;