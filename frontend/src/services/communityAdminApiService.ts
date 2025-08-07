import API from "@/lib/axios"

// Application Flow
export const submitCommunityApplication = async (applicationData: any) => {
  try {
    const response = await API.post("/api/community-admin/apply", applicationData)
    return {
      success: true,
      requestId: response.data.requestId,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Submit application error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Application submission failed",
    }
  }
}

export const setPassword = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/community-admin/set-password", { email, password })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Set password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Password setting failed",
    }
  }
}

export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post("/api/community-admin/verify-otp", { email, otp })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "OTP verification failed",
    }
  }
}

// Authentication
export const login = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/community-admin/login", { email, password })
    return {
      success: true,
      communityAdmin: response.data.communityAdmin,
      token: response.data.accessToken || response.data.token,
    }
  } catch (error: any) {
    console.error("Community admin login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Login failed",
      status: error.response?.status,
    }
  }
}

export const logout = async () => {
  try {
    await API.post("/api/community-admin/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Community admin logout error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Logout failed",
    }
  }
}

// Forgot Password Flow
export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post("/api/community-admin/forgot-password", { email })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Forgot password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to send reset code",
    }
  }
}

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post("/api/community-admin/verify-forgot-password-otp", { email, otp })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Verify forgot password OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Invalid OTP",
    }
  }
}

export const resetPassword = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/community-admin/reset-password", { email, password })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Reset password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Password reset failed",
    }
  }
}

// Profile
export const getProfile = async () => {
  try {
    const response = await API.get("/api/community-admin/profile")
    return {
      success: true,
      communityAdmin: response.data.communityAdmin,
    }
  } catch (error: any) {
    console.error("Get profile error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to get profile",
    }
  }
}
