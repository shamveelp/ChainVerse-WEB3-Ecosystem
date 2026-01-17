import { AxiosError } from 'axios';
import API from "@/lib/api-client"
import { USER_API_ROUTES, ADMIN_API_ROUTES } from "@/routes"

import { ApiResponse } from "@/types/common.types"
import { LoginResponse, RegisterResponse, UsernameCheckResponse, GenerateUsernameResponse } from "@/types/user/auth.types"

export const login = async (email: string, password: string) => {
  try {
    const response = await API.post<LoginResponse>(USER_API_ROUTES.LOGIN, { email, password })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Login error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Login failed",
    }
  }
}

export const register = async (username: string, email: string, password: string, name: string, referralCode?: string) => {
  try {
    const payload: Record<string, unknown> = { username, email, password, name }

    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim().toUpperCase()
    }

    const response = await API.post<RegisterResponse>(USER_API_ROUTES.REGISTER, payload)
    return {
      success: true,
      message: response.data.message || "Registration successful, OTP sent",
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Register error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Registration failed",
    }
  }
}

export const signup = async (username: string, email: string, password: string, name: string, referralCode: string | undefined, otp: string) => {
  try {
    const payload: Record<string, unknown> = {
      username,
      email,
      password,
      name,
      otp,
    }

    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim().toUpperCase()
    }

    const response = await API.post<LoginResponse>(USER_API_ROUTES.VERIFY_OTP, payload)
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Signup error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Account creation failed",
    }
  }
}

export const checkUsername = async (username: string) => {
  try {
    const response = await API.post<UsernameCheckResponse>(USER_API_ROUTES.CHECK_USERNAME, { username })
    return {
      success: true,
      available: response.data.available,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Check username error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      available: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to check username",
    }
  }
}

export const generateUsername = async () => {
  try {
    const response = await API.get<GenerateUsernameResponse>(USER_API_ROUTES.GENERATE_USERNAME)
    return {
      success: true,
      username: response.data.username,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Generate username error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to generate username",
    }
  }
}

export const requestOtp = async (email: string) => {
  try {
    const response = await API.post<ApiResponse>(USER_API_ROUTES.REQUEST_OTP, { email })
    return {
      success: response.data.success || true,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Request OTP error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to request OTP",
    }
  }
}

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post<ApiResponse>(USER_API_ROUTES.FORGOT_PASSWORD, { email })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Forgot password error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to send reset code",
    }
  }
}

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post<ApiResponse>(USER_API_ROUTES.VERIFY_FORGOT_PASSWORD_OTP, { email, otp })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Verify forgot password OTP error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Invalid OTP",
    }
  }
}

export const resetPassword = async (email: string, newPassword: string) => {
  try {
    const response = await API.post<ApiResponse>(USER_API_ROUTES.RESET_PASSWORD, { email, newPassword })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Reset password error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Password reset failed",
    }
  }
}

export const logout = async () => {
  try {
    await API.post(USER_API_ROUTES.LOGOUT)
    return { success: true }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Logout error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Logout failed",
    }
  }
}

export const googleLogin = async (credential: string, referralCode?: string) => {
  try {
    const payload: Record<string, unknown> = { token: credential }
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim().toUpperCase()
    }
    const response = await API.post<LoginResponse>(USER_API_ROUTES.GOOGLE_LOGIN, payload)
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Google login error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Google login failed",
    }
  }
}

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
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Admin login error:", axiosError.response?.data || axiosError.message);
    throw {
      success: false,
      error: axiosError.response?.data?.message || axiosError.message || "Login failed",
      response: axiosError.response,
    };
  }
};

export const adminLogout = async () => {
  try {
    await API.post(ADMIN_API_ROUTES.LOGOUT)
    return { success: true }
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    console.error("Admin logout error:", axiosError.response?.data || axiosError.message)
    return {
      success: false,
      error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Admin logout failed",
    }
  }
}