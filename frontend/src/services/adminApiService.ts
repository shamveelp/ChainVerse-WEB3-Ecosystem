import API from "@/lib/api-client";

// Auth Services
export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/admin/login", { email, password });
    return {
      success: true,
      admin: response.data.admin,
      token: response.data.accessToken,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Admin login error:", error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.message || error.message || "Login failed",
      response: error.response,
    };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post("/api/admin/forgot-password", { email });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Forgot password error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to send reset code",
    };
  }
};

export const verifyResetOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post("/api/admin/verify-forgot-password-otp", { email, otp });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Verify reset OTP error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Invalid OTP",
    };
  }
};

export const resetPassword = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/admin/reset-password", { email, password });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Reset password error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Password reset failed",
    };
  }
};

export const getAdminProfile = async () => {
  try {
    const response = await API.get("/api/admin/profile");
    return {
      success: true,
      admin: response.data.admin,
    };
  } catch (error: any) {
    console.error("Get admin profile error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to get profile",
    };
  }
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await API.post("/api/admin/change-password", { currentPassword, newPassword });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Change password error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to change password",
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
    const response = await API.get(`/api/admin/users?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || response.data.users || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get users error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch users",
    };
  }
};

export const getUserById = async (id: string) => {
  try {
    const response = await API.get(`/api/admin/users/${id}`);
    return response.data.user || response.data;
  } catch (error: any) {
    console.error("Get user by id error:", error.response?.data || error.message);
    throw error;
  }
};

export const toggleUserBan = async (userId: string, isBanned: boolean) => {
  try {
    const response = await API.patch(`/api/admin/users/${userId}/ban`, { isBanned });
    return response.data.user || response.data;
  } catch (error: any) {
    console.error("Toggle user ban error:", error.response?.data || error.message);
    throw error;
  }
};

export const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
  try {
    await API.patch(`/api/admin/users/${userId}`, { isBlocked });
    const response = await API.get(`/api/admin/users/${userId}`);
    return response.data.user || response.data;
  } catch (error: any) {
    console.error("Toggle user block error:", error.response?.data || error.message);
    throw error;
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
    
    const response = await API.get(`/api/admin/community-requests?${params.toString()}`);
    
    return {
      success: true,
      data: response.data.data || response.data,
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / limit),
      message: response.data.message
    };
  } catch (error: any) {
    console.error("Get community requests error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch community requests",
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
    const response = await API.get(`/api/admin/community-requests/${requestId}`);
    return {
      success: true,
      data: response.data.request || response.data.data,
      message: response.data.message
    };
  } catch (error: any) {
    console.error("Get community request by ID error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch community request",
    };
  }
};

export const approveCommunityRequest = async (requestId: string) => {
  try {
    const response = await API.patch(`/api/admin/community-requests/${requestId}/approve`);
    return {
      success: true,
      message: response.data.message || "Community request approved successfully",
      request: response.data.request
    };
  } catch (error: any) {
    console.error("Approve community request error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to approve request",
    };
  }
};

export const rejectCommunityRequest = async (requestId: string, reason: string) => {
  try {
    const response = await API.patch(`/api/admin/community-requests/${requestId}/reject`, { reason });
    return {
      success: true,
      message: response.data.message || "Community request rejected successfully",
      request: response.data.request
    };
  } catch (error: any) {
    console.error("Reject community request error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to reject request",
    };
  }
};

export const exportCommunityRequests = async () => {
  try {
    const response = await API.get("/api/admin/community-requests/export");
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Export community requests error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to export community requests",
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
    const response = await API.get(`/api/admin/wallets?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallets error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallets",
    };
  }
};

export const getWalletDetails = async (address: string) => {
  try {
    const response = await API.get(`/api/admin/wallets/${address}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallet details error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallet details",
    };
  }
};

export const getWalletStats = async () => {
  try {
    const response = await API.get("/api/admin/wallets/stats");
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallet stats error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallet statistics",
    };
  }
};

export const getWalletTransactions = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/wallets/${address}/transactions?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallet transactions error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallet transactions",
    };
  }
};

export const getWalletHistoryFromEtherscan = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/wallets/${address}/history?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallet Etherscan history error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallet history from Etherscan",
    };
  }
};

export const getWalletAppHistory = async (address: string, page: number = 1, limit: number = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/wallets/${address}/app-history?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get wallet app history error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to fetch wallet app history",
    };
  }
};

export const exportWalletData = async () => {
  try {
    const response = await API.get("/api/admin/wallets/export");
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Export wallet data error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to export wallet data",
    };
  }
};

export const refreshWalletData = async (address: string) => {
  try {
    const response = await API.post(`/api/admin/wallets/${address}/refresh`);
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Refresh wallet data error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to refresh wallet data",
    };
  }
};

export const getWalletBlockchainTransactions = async (address: string, page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await API.get(`/api/admin/wallets/${address}/blockchain-transactions?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching blockchain transactions:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch blockchain transactions'
    };
  }
};

export const getWalletContractInteractions = async (address: string) => {
  try {
    const response = await API.get(`/api/admin/wallets/${address}/contract-interactions`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching contract interactions:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch contract interactions'
    };
  }
};