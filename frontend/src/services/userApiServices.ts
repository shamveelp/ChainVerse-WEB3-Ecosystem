import API from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { AxiosError } from "axios";

// User interfaces
import {
  UserProfile,
  UpdateProfileData,
  CheckInStatus,
  DailyCheckInResult,
  ReferralStats
} from "@/types/user/user.types";

interface ApiErrorData {
  error?: string;
  message?: string;
  success?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  // For specific endpoints that might return flat props
  available?: boolean;
  profilePic?: string;
  imageUrl?: string;
}

// Helper function to handle API errors
const handleApiError = <T = unknown>(error: AxiosError<ApiErrorData>, defaultMessage: string): ApiResponse<T> => {
  console.error("User API Error:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method
  });

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;

  return {
    success: false,
    error: errorMessage
  };
};

export const userApiService = {
  // Profile management
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await API.get(USER_API_ROUTES.GET_PROFILE);

      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to fetch profile"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch profile");
    }
  },

  updateProfile: async (data: Record<string, unknown>): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await API.put(USER_API_ROUTES.UPDATE_PROFILE, data);

      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to update profile"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to update profile");
    }
  },

  checkUsernameAvailability: async (username: string): Promise<ApiResponse> => {
    try {
      const response = await API.get(`${USER_API_ROUTES.CHECK_USERNAME}?username=${username}`);
      return {
        success: response.data?.success,
        available: response.data?.available,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        available: false,
        message: "Error checking username"
      };
    }
  },

  uploadProfileImage: async (file: File): Promise<ApiResponse<UserProfile>> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await API.post(USER_API_ROUTES.UPLOAD_PROFILE_IMAGE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data,
          profilePic: response.data.data?.profilePic,
          imageUrl: response.data.data?.profilePic // Compatibility for different components
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to upload image"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to upload image");
    }
  },

  // Security
  changePassword: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    try {
      const response = await API.post(USER_API_ROUTES.CHANGE_PASSWORD, data);

      if (response.data?.success) {
        return response.data;
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to change password"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to change password");
    }
  },

  // Stats and Rewards
  getStats: async (): Promise<ApiResponse> => {
    try {
      const response = await API.get(USER_API_ROUTES.USER_STATS);

      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to fetch stats"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch stats");
    }
  },

  // Notifications
  getNotificationSettings: async (): Promise<ApiResponse> => {
    try {
      const response = await API.get(USER_API_ROUTES.NOTIFICATION_SETTINGS);

      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to fetch notification settings"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch notification settings");
    }
  },

  updateNotificationSettings: async (settings: Record<string, unknown>): Promise<ApiResponse> => {
    try {
      const response = await API.put(USER_API_ROUTES.NOTIFICATION_SETTINGS_UPDATE, settings);

      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to update notification settings"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to update notification settings");
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
      return null;
    }
  },

  // Onboarding
  completeOnboarding: async (step: string): Promise<ApiResponse> => {
    try {
      const response = await API.post(USER_API_ROUTES.COMPLETE_ONBOARDING, { step });

      if (response.data?.success) {
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.error || response.data?.message || "Failed to complete onboarding step"
      };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to complete onboarding step");
    }
  },

  getReferralLink: async (): Promise<string> => {
    try {
      const response = await API.get(USER_API_ROUTES.REFERRALS_STATS);

      if (response.data?.success && response.data?.data?.referralCode) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/register?ref=${response.data.data.referralCode}`;
      }
      return "";
    } catch (error) {
      return "";
    }
  },

  // Points and Daily Check-in
  getCheckInStatus: async (): Promise<ApiResponse<CheckInStatus>> => {
    try {
      const response = await API.get(USER_API_ROUTES.POINTS_CHECKIN_STATUS);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: "Failed to fetch check-in status" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch check-in status");
    }
  },

  getCheckInCalendar: async (month?: number, year?: number): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month.toString());
      if (year) params.append("year", year.toString());

      const response = await API.get(`${USER_API_ROUTES.POINTS_CHECKIN_CALENDAR}${params.toString() ? `?${params.toString()}` : ""}`);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: "Failed to fetch check-in calendar" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch check-in calendar");
    }
  },

  getPointsHistory: async (page: number = 1, limit: number = 10): Promise<ApiResponse> => {
    try {
      const response = await API.get(`${USER_API_ROUTES.POINTS_HISTORY}?page=${page}&limit=${limit}`);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: "Failed to fetch points history" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch points history");
    }
  },

  performDailyCheckIn: async (): Promise<ApiResponse<DailyCheckInResult>> => {
    try {
      const response = await API.post(USER_API_ROUTES.POINTS_DAILY_CHECKIN);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: response.data?.message || "Failed to perform check-in" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to perform check-in");
    }
  },

  // Referrals
  getReferralStats: async (): Promise<ApiResponse<ReferralStats>> => {
    try {
      const response = await API.get(USER_API_ROUTES.REFERRALS_STATS);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: "Failed to fetch referral stats" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch referral stats");
    }
  },

  getReferralHistory: async (page: number = 1, limit: number = 10): Promise<ApiResponse> => {
    try {
      const response = await API.get(`${USER_API_ROUTES.REFERRALS_HISTORY}?page=${page}&limit=${limit}`);
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return { success: false, error: "Failed to fetch referral history" };
    } catch (error) {
      return handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch referral history");
    }
  }
};
