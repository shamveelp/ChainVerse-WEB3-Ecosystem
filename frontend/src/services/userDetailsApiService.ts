import API from "@/lib/api-client";
import { ADMIN_API_ROUTES } from "@/routes";
import { AxiosError } from "axios";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const getUserReferrals = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.USER_REFERRALS(userId)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.referrals || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user referrals error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch referrals",
    };
  }
};

export const getUserPointsHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.USER_POINTS_HISTORY(userId)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.history || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user points history error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch points history",
    };
  }
};

export const getUserCheckInHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.USER_CHECKIN_HISTORY(userId)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.checkIns || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user check-in history error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch check-in history",
    };
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.USER_STATS(userId));
    return {
      success: true,
      data: response.data.stats || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user stats error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch user stats",
    };
  }
};
