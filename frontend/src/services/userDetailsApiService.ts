import API from "@/lib/axios"

// User details and referral services
export const getUserReferrals = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await API.get(`/api/admin/users/${userId}/referrals?page=${page}&limit=${limit}`)
    return {
      success: true,
      data: response.data.data || response.data.referrals || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || 1
    }
  } catch (error: any) {
    console.error("Get user referrals error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch referrals",
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  }
}

export const getUserPointsHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await API.get(`/api/admin/users/${userId}/points-history?page=${page}&limit=${limit}`)
    return {
      success: true,
      data: response.data.data || response.data.history || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || 1
    }
  } catch (error: any) {
    console.error("Get user points history error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch points history",
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  }
}

export const getUserCheckInHistory = async (userId: string, month: number, year: number) => {
  try {
    const response = await API.get(`/api/admin/users/${userId}/checkin-history?month=${month}&year=${year}`)
    return {
      success: true,
      data: response.data.data || response.data.checkIns || [],
    }
  } catch (error: any) {
    console.error("Get user check-in history error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch check-in history",
      data: [],
    }
  }
}

export const getUserStats = async (userId: string) => {
  try {
    const response = await API.get(`/api/admin/users/${userId}/stats`)
    return {
      success: true,
      data: response.data.data || response.data.stats || {}
    }
  } catch (error: any) {
    console.error("Get user stats error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch user stats",
      data: {}
    }
  }
}