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

export const register = async (username: string, email: string, password: string, name: string, referralCode?: string) => {
  try {
    const payload: any = { username, email, password, name }
    
    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim()
    }
    
    const response = await API.post("/api/user/register", payload)
    return {
      success: true,
      message: response.data.message || "Registration successful, OTP sent",
    }
  } catch (error: any) {
    console.error("Register error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Registration failed",
    }
  }
}

export const signup = async (username: string, email: string, password: string, name: string, referralCode: string | undefined, otp: string) => {
  try {
    const payload: any = {
      username,
      email,
      password,
      name,
      otp,
    }
    
    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim()
    }
    
    const response = await API.post("/api/user/verify-otp", payload)
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

export const checkUsername = async (username: string) => {
  try {
    const response = await API.post("/api/user/check-username", { username })
    return {
      success: true,
      available: response.data.available,
    }
  } catch (error: any) {
    console.error("Check username error:", error.response?.data || error.message)
    return {
      success: false,
      available: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to check username",
    }
  }
}

export const generateUsername = async () => {
  try {
    const response = await API.get("/api/user/generate-username")
    return {
      success: true,
      username: response.data.username,
    }
  } catch (error: any) {
    console.error("Generate username error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to generate username",
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
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send reset code",
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

export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/admin/login", { email, password })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken || response.data.token,
    }
  } catch (error: any) {
    console.error("Admin login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Admin login failed",
    }
  }
}

export const adminLogout = async () => {
  try {
    await API.post("/api/admin/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Admin logout error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Admin logout failed",
    }
  }
}