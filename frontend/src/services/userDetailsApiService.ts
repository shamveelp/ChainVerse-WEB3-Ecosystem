import API from "@/lib/api-client";

export const getUserReferrals = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/users/${userId}/referrals?${params.toString()}`);
    return {
      success: true,
      data: response.data.referrals || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get user referrals error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch referrals",
    };
  }
};

export const getUserPointsHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/users/${userId}/points-history?${params.toString()}`);
    return {
      success: true,
      data: response.data.history || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get user points history error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch points history",
    };
  }
};

export const getUserCheckInHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await API.get(`/api/admin/users/${userId}/checkin-history?${params.toString()}`);
    return {
      success: true,
      data: response.data.checkIns || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || 1,
      limit: response.data.limit || limit,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get user check-in history error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch check-in history",
    };
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const response = await API.get(`/api/admin/users/${userId}/stats`);
    return {
      success: true,
      data: response.data.stats || {},
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Get user stats error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch user stats",
    };
  }
};