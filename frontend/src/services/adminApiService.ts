import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { ADMIN_API_ROUTES } from "@/routes";

interface ApiErrorData {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// Auth Services
export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.LOGIN, { email, password });
    return {
      success: true,
      admin: response.data.admin,
      token: response.data.accessToken,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Admin login error:", axiosError.response?.data || axiosError.message);
    throw {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Login failed",
      response: axiosError.response,
    };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.FORGOT_PASSWORD, { email });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Forgot password error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to send reset code",
    };
  }
};

export const verifyResetOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.VERIFY_RESET_OTP, { email, otp });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Verify reset OTP error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Invalid OTP",
    };
  }
};

export const resetPassword = async (email: string, password: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.RESET_PASSWORD, { email, password });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Reset password error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Password reset failed",
    };
  }
};

export const getAdminProfile = async () => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.PROFILE);
    return {
      success: true,
      admin: response.data.admin,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get admin profile error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to get profile",
    };
  }
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.CHANGE_PASSWORD, { currentPassword, newPassword });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Change password error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to change password",
    };
  }
};

// User Management Services
export const getUsers = async (page: number, limit: number = 10, search: string = "") => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search,
    });
    const response = await API.get(`${ADMIN_API_ROUTES.USERS}?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || response.data.users || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get users error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to fetch users",
    };
  }
};

export const getUserById = async (id: string) => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.USER_BY_ID(id));
    return response.data.user || response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user by id error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const toggleUserBan = async (userId: string, isBanned: boolean) => {
  try {
    const response = await API.patch(ADMIN_API_ROUTES.USER_BAN(userId), { isBanned });
    return response.data.user || response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Toggle user ban error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
  try {
    await API.patch(ADMIN_API_ROUTES.USER_BY_ID(userId), { isBlocked });
    const response = await API.get(ADMIN_API_ROUTES.USER_BY_ID(userId));
    return response.data.user || response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Toggle user block error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

// Community Management Services
export const getAllCommunityRequests = async (page: number = 1, limit: number = 10, search: string = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search,
    });

    const response = await API.get(`${ADMIN_API_ROUTES.COMMUNITY_REQUESTS}?${params.toString()}`);

    return {
      success: true,
      data: response.data.data || response.data,
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / limit),
      message: response.data.message
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get community requests error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to fetch community requests",
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    };
  }
};

export const getCommunityRequestById = async (requestId: string) => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.COMMUNITY_REQUEST_BY_ID(requestId));

    return {
      success: true,
      data: response.data.request || response.data.data,
      message: response.data.message
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get community request by ID error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to fetch community request",
    };
  }
};

export const approveCommunityRequest = async (requestId: string) => {
  try {
    const response = await API.patch(ADMIN_API_ROUTES.APPROVE_COMMUNITY_REQUEST(requestId));
    return {
      success: true,
      message: response.data.message || "Community request approved successfully",
      request: response.data.request
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Approve community request error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to approve request",
    };
  }
};

export const rejectCommunityRequest = async (requestId: string, reason: string) => {
  try {
    const response = await API.patch(ADMIN_API_ROUTES.REJECT_COMMUNITY_REQUEST(requestId), { reason });
    return {
      success: true,
      message: response.data.message || "Community request rejected successfully",
      request: response.data.request
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Reject community request error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Failed to reject request",
    };
  }
};

export const exportCommunityRequests = async () => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.EXPORT_COMMUNITY_REQUESTS);
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Export community requests error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to export community requests",
    };
  }
};

// Wallet Management Services
export const getAllWallets = async (page: number = 1, limit: number = 20, search: string = "") => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await API.get(`${ADMIN_API_ROUTES.WALLETS}?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallets error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallets",
    };
  }
};

export const getWalletDetails = async (address: string) => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.WALLET_BY_ADDRESS(address));
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallet details error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallet details",
    };
  }
};

export const getWalletStats = async () => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.WALLET_STATS);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallet stats error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallet statistics",
    };
  }
};

export const getWalletTransactions = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.WALLET_TRANSACTIONS(address)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallet transactions error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallet transactions",
    };
  }
};

export const getWalletHistoryFromEtherscan = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.WALLET_HISTORY(address)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallet Etherscan history error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallet history from Etherscan",
    };
  }
};

export const getWalletAppHistory = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`${ADMIN_API_ROUTES.WALLET_APP_HISTORY(address)}?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get wallet app history error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to fetch wallet app history",
    };
  }
};

export const exportWalletData = async () => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.EXPORT_WALLETS);
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Export wallet data error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to export wallet data",
    };
  }
};

export const refreshWalletData = async (address: string) => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.REFRESH_WALLET(address));
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Refresh wallet data error:", axiosError.response?.data || axiosError.message);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || "Failed to refresh wallet data",
    };
  }
};

export const getWalletBlockchainTransactions = async (address: string, page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await API.get(`${ADMIN_API_ROUTES.WALLET_BLOCKCHAIN_TRANSACTIONS(address)}?${params.toString()}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error('Error fetching blockchain transactions:', axiosError);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || 'Failed to fetch blockchain transactions'
    };
  }
};

export const getWalletContractInteractions = async (address: string) => {
  try {
    const response = await API.get(ADMIN_API_ROUTES.WALLET_CONTRACT_INTERACTIONS(address));
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error('Error fetching contract interactions:', axiosError);
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.message || 'Failed to fetch contract interactions'
    };
  }
};
