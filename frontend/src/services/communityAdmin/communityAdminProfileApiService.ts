import { AxiosError } from 'axios';
import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

// Types
import { ApiResponse } from "@/types/common.types";
import {
  CommunityStats,
  CommunityAdminProfile,
  UpdateProfileData
} from "@/types/comms-admin/profile.types";

class CommunityAdminProfileApiService {
  // Get profile
  async getProfile(): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.PROFILE);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("Get community admin profile error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get profile",
      };
    }
  }

  // Update profile
  async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const cleanData = {
        name: profileData.name?.trim(),
        bio: profileData.bio?.trim() || "",
        location: profileData.location?.trim() || "",
        website: profileData.website?.trim() || ""
      };

      const response = await api.put(COMMUNITY_ADMIN_API_ROUTES.PROFILE, cleanData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("Update community admin profile error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to update profile",
      };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.PROFILE_UPLOAD_PICTURE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("Upload profile picture error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to upload profile picture",
      };
    }
  }

  // Upload banner image
  async uploadBannerImage(file: File): Promise<ApiResponse<CommunityAdminProfile>> {
    try {
      const formData = new FormData();
      formData.append('bannerImage', file);

      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.PROFILE_UPLOAD_BANNER, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("Upload banner image error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to upload banner image",
      };
    }
  }

  // Get community stats
  async getCommunityStats(period: string = 'week'): Promise<ApiResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.COMMUNITY_STATS}?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("Get community stats error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get community stats",
      };
    }
  }
}

export const communityAdminProfileApiService = new CommunityAdminProfileApiService();
export default communityAdminProfileApiService;