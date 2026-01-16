import API from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { AxiosError } from "axios";

// User interfaces
import {
  UserProfile,
  UpdateProfileData,
  ChangePasswordData,
  UserStats,
  NotificationSettings,
  CommunityMember
} from "@/types/user/profile.types";

interface ApiErrorData {
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: AxiosError<ApiErrorData>, defaultMessage: string) => {
  console.error("User API Error:", {
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

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

export const userApiServices = {
  // Profile management
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await API.get(USER_API_ROUTES.PROFILE);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch profile");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch profile");
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    try {
      const response = await API.put(USER_API_ROUTES.PROFILE_UPDATE, data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update profile");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to update profile");
      throw error;
    }
  },

  // Security
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.post(USER_API_ROUTES.CHANGE_PASSWORD, data);

      if (response.data?.success) {
        return response.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to change password");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to change password");
      throw error;
    }
  },

  // Stats and Rewards
  getStats: async (): Promise<UserStats> => {
    try {
      const response = await API.get(USER_API_ROUTES.USER_STATS);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch stats");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch stats");
      throw error;
    }
  },

  // Notifications
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await API.get(USER_API_ROUTES.NOTIFICATION_SETTINGS);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch notification settings");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch notification settings");
      throw error;
    }
  },

  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    try {
      const response = await API.put(USER_API_ROUTES.NOTIFICATION_SETTINGS_UPDATE, settings);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update notification settings");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to update notification settings");
      throw error;
    }
  },

  // Community interactions
  getJoinedCommunities: async (): Promise<CommunityMember[]> => {
    try {
      const response = await API.get(USER_API_ROUTES.JOINED_COMMUNITIES);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch joined communities");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch joined communities");
      throw error;
    }
  },

  // Wallet
  getWalletAddress: async (): Promise<string | null> => {
    try {
      const response = await API.get(USER_API_ROUTES.WALLET_ADDRESS);

      if (response.data?.success) {
        return response.data.data?.address || null;
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      if (axiosError.response?.status === 404) return null;
      handleApiError(axiosError, "Failed to fetch wallet address");
      throw error;
    }
  },

  // Onboarding
  completeOnboarding: async (step: string): Promise<{ success: boolean }> => {
    try {
      const response = await API.post(USER_API_ROUTES.COMPLETE_ONBOARDING, { step });

      if (response.data?.success) {
        return { success: true };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to complete onboarding step");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to complete onboarding step");
      throw error;
    }
  },

  getReferralLink: async (): Promise<string> => {
    try {
      const response = await API.get(USER_API_ROUTES.REFERRAL_CODE);

      if (response.data?.success && response.data?.data?.code) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/register?ref=${response.data.data.code}`;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch referral code");
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch referral code");
      throw error;
    }
  }
};
