import API from "@/lib/axios"

export const getUsers = async (page: number, limit: number = 7, search: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: search
  })
  const res = await API.get(`/api/admin/users?${params.toString()}`)
  console.log(res.data)
  return res.data
}

export const toggleUserBan = async (userId: string, isBanned: boolean) => {
  await API.patch(`/api/admin/users/${userId}`, { isBanned })
  const res = await API.get(`/api/admin/users/${userId}`)
  return res.data
}

export const getUserById = async (id: string) => {
  const res = await API.get(`/api/admin/users/${id}`)
  return res.data
}

export const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
  await API.patch(`/api/admin/users/${userId}`, { isBlocked })
  const res = await API.get(`/api/admin/users/${userId}`)
  return res.data
}

export const updateUserPoints = async (userId: string, points: number) => {
  const res = await API.patch(`/api/admin/users/${userId}/points`, { points })
  return res.data
}



export const getAllCommunityRequests = async (page: number = 1, limit: number = 10, search: string = '') => {
  try {
    const response = await API.get(`/api/admin/community-requests?page=${page}&limit=${limit}&search=${search}`)
    return {
      success: true,
      data: response.data.data || response.data,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit
    }
  } catch (error: any) {
    console.error("Get community requests error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch community requests",
    }
  }
}

export const approveCommunityRequest = async (requestId: string) => {
  try {
    const response = await API.patch(`/api/admin/community-requests/${requestId}/approve`)
    return {
      success: true,
      message: response.data.message,
      request: response.data.request
    }
  } catch (error: any) {
    console.error("Approve community request error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to approve request",
    }
  }
}

export const rejectCommunityRequest = async (requestId: string, reason: string) => {
  try {
    const response = await API.patch(`/api/admin/community-requests/${requestId}/reject`, { reason })
    return {
      success: true,
      message: response.data.message,
      request: response.data.request
    }
  } catch (error: any) {
    console.error("Reject community request error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to reject request",
    }
  }
}