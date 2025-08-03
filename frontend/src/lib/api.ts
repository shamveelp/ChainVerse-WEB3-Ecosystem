import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending/receiving cookies (like refresh tokens)
})

export const apiService = {
  requestOtp: async (email: string) => {
    try {
      const response = await api.post("/api/users/request-otp", { email })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error("Request OTP error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to request OTP",
      }
    }
  },
  verifyOtp: async (email: string, otp: string, name: string, password: string) => {
    try {
      const response = await api.post("/api/users/verify-otp", { email, otp, name, password })
      return { success: true, message: response.data.message, user: response.data.user }
    } catch (error: any) {
      console.error("Verify OTP error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to verify OTP",
      }
    }
  },
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post("/api/users/forgot-password", { email })
      // Backend now returns resetToken
      return { success: true, message: response.data.message, resetToken: response.data.resetToken }
    } catch (error: any) {
      console.error("Forgot password request error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to request password reset",
      }
    }
  },
  // Changed email to resetToken in parameters and expected response
  verifyForgotPasswordOtp: async (resetToken: string, otp: string) => {
    try {
      const response = await api.post("/api/users/verify-forgot-password-otp", { resetToken, otp })
      // Backend now returns passwordResetToken
      return { success: true, message: response.data.message, passwordResetToken: response.data.passwordResetToken }
    } catch (error: any) {
      console.error("Verify forgot password OTP error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to verify forgot password OTP",
      }
    }
  },
  // Changed email to passwordResetToken in parameters
  resetPassword: async (passwordResetToken: string, newPassword: string) => {
    try {
      const response = await api.post("/api/users/reset-password", { passwordResetToken, newPassword })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error("Reset password error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to reset password",
      }
    }
  },
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/api/users/login", { email, password })
      // Assuming tokens are set as HTTP-only cookies, so not returned in data
      return { success: true, user: response.data.user }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Invalid credentials",
      }
    }
  },
  logout: async () => {
    try {
      await api.post("/api/users/logout")
      return { success: true }
    } catch (error: any) {
      console.error("Logout error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to logout",
      }
    }
  },
  refreshToken: async () => {
    try {
      const response = await api.post("/api/users/refresh-token") // Corrected endpoint name
      // Backend should return accessToken if successful, but user is fetched separately
      return { success: true, accessToken: response.data.accessToken }
    } catch (error: any) {
      console.error("Refresh token error:", error)
      return { success: false, error: error.response?.data?.error?.message || error.message }
    }
  },
  // New method to get user details after a successful refresh or initial load
  getCurrentUser: async () => {
    try {
      const response = await api.get("/api/users/me") // Assuming a /me endpoint exists on your backend
      return { success: true, user: response.data.user }
    } catch (error: any) {
      console.error("Get current user details error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Failed to fetch user details",
      }
    }
  },
  googleAuth: async (idToken: string) => {
    try {
      const response = await api.post("/api/users/google-auth", { idToken })
      // Assuming tokens are set as HTTP-only cookies, so not returned in data
      return { success: true, user: response.data.user }
    } catch (error: any) {
      console.error("Google auth error:", error)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || "Google authentication failed",
      }
    }
  },
}
