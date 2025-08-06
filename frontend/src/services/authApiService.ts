import API from "@/lib/api-client"

export const login = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/user/login", { email, password })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken || response.data.token,
    }
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Login failed",
    }
  }
}

export const signup = async (name: string, email: string, password: string, otp: string) => {
  try {
    const response = await API.post("/api/user/verify-otp", {
      name,
      email,
      password,
      otp,
    })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken || response.data.token,
    }
  } catch (error: any) {
    console.error("Signup error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Signup failed",
    }
  }
}

export const requestOtp = async (email: string) => {
  try {
    const response = await API.post("/api/user/request-otp", { email })
    return {
      success: response.data.success || true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Request OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to request OTP",
    }
  }
}

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post("/api/user/forgot-password", { email })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Forgot password error:", error.response?.data || error.message)
    return {
      success: false,
      error:
        error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send reset code",
    }
  }
}

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post("/api/user/verify-forgot-password-otp", { email, otp })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Verify forgot password OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Invalid OTP",
    }
  }
}

export const resetPassword = async (email: string, newPassword: string) => {
  try {
    const response = await API.post("/api/user/reset-password", { email, newPassword })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Reset password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Password reset failed",
    }
  }
}

export const logout = async () => {
  try {
    await API.post("/api/user/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Logout error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Logout failed",
    }
  }
}

export const googleLogin = async (credential: string) => {
  try {
    const response = await API.post("/api/user/google-login", { token: credential })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken || response.data.token,
    }
  } catch (error: any) {
    console.error("Google login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Google login failed",
    }
  }
}




// Admin Auth

export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/admin/login", { email, password })
    return response.data
  } catch (error: any) {
    console.error("Admin login error:", error.response?.data || error.message)
    throw error
  }
}

export const adminLogout = async () => {
  try {
    await API.post("/api/admin/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Admin logout error:", error.response?.data || error.message)
    throw error
  }
}




