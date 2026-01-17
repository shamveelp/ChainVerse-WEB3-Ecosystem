import { AxiosError } from 'axios';
import api from "@/lib/api-client"
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes"

import { ApiResponse } from "@/types/common.types"
import {
  CommunityApplicationData,
  CommunitySettings,
  CommunityDetails,
  CheckExistenceResponse
} from "@/types/comms-admin/community-admin.types"

interface ApiErrorResponse {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

class CommunityAdminApiService {
  // Live validation endpoints
  async checkEmailExists(email: string): Promise<CheckExistenceResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.CHECK_EMAIL}?email=${encodeURIComponent(email)}`)
      return {
        exists: response.data.exists,
        success: true,
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Check email error:", axiosError)
      throw new Error(axiosError.response?.data?.message || axiosError.message || "Failed to check email")
    }
  }

  async checkUsernameExists(username: string): Promise<CheckExistenceResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.CHECK_USERNAME}?username=${encodeURIComponent(username)}`)
      return {
        exists: response.data.exists,
        success: true,
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Check username error:", axiosError)
      throw new Error(axiosError.response?.data?.message || axiosError.message || "Failed to check username")
    }
  }

  // Application Flow
  async submitCommunityApplication(applicationData: CommunityApplicationData): Promise<ApiResponse> {
    try {
      const formData = new FormData()

      // Add text fields - trim all strings
      formData.append('communityName', applicationData.communityName.trim())
      formData.append('email', applicationData.email.trim().toLowerCase())
      formData.append('username', applicationData.username.trim())
      formData.append('walletAddress', applicationData.walletAddress.trim())
      formData.append('description', applicationData.description.trim())
      formData.append('category', applicationData.category.trim())
      formData.append('whyChooseUs', applicationData.whyChooseUs.trim())

      // Handle arrays and objects properly
      const cleanRules = applicationData.rules
        .filter(rule => rule.trim() !== '')
        .map(rule => rule.trim())

      formData.append('rules', JSON.stringify(cleanRules))

      // Clean social links
      const cleanSocialLinks = {
        twitter: applicationData.socialLinks.twitter.trim(),
        discord: applicationData.socialLinks.discord.trim(),
        telegram: applicationData.socialLinks.telegram.trim(),
        website: applicationData.socialLinks.website.trim()
      }

      formData.append('socialLinks', JSON.stringify(cleanSocialLinks))

      // Handle file uploads
      if (applicationData.logo instanceof File) {
        formData.append('logo', applicationData.logo)
      }

      if (applicationData.banner instanceof File) {
        formData.append('banner', applicationData.banner)
      }

      console.log('Submitting form data:', {
        communityName: applicationData.communityName,
        email: applicationData.email,
        username: applicationData.username,
        walletAddress: applicationData.walletAddress,
        description: applicationData.description.length,
        category: applicationData.category,
        whyChooseUs: applicationData.whyChooseUs.length,
        rules: cleanRules,
        socialLinks: cleanSocialLinks,
        hasLogo: !!applicationData.logo,
        hasBanner: !!applicationData.banner
      })

      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.APPLY, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      })

      return {
        success: true,
        data: {
          requestId: response.data.requestId,
          message: response.data.message
        },
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Submit application error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      })

      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Application submission failed",
      }
    }
  }

  async reapplyApplication(applicationData: CommunityApplicationData): Promise<ApiResponse> {
    try {
      const formData = new FormData()

      // Add text fields - trim all strings
      formData.append('communityName', applicationData.communityName.trim())
      formData.append('email', applicationData.email.trim().toLowerCase())
      formData.append('username', applicationData.username.trim())
      formData.append('walletAddress', applicationData.walletAddress.trim())
      formData.append('description', applicationData.description.trim())
      formData.append('category', applicationData.category.trim())
      formData.append('whyChooseUs', applicationData.whyChooseUs.trim())

      // Handle arrays and objects properly
      const cleanRules = applicationData.rules
        .filter(rule => rule.trim() !== '')
        .map(rule => rule.trim())

      formData.append('rules', JSON.stringify(cleanRules))

      // Clean social links
      const cleanSocialLinks = {
        twitter: applicationData.socialLinks.twitter.trim(),
        discord: applicationData.socialLinks.discord.trim(),
        telegram: applicationData.socialLinks.telegram.trim(),
        website: applicationData.socialLinks.website.trim()
      }

      formData.append('socialLinks', JSON.stringify(cleanSocialLinks))

      // Handle file uploads
      if (applicationData.logo instanceof File) {
        formData.append('logo', applicationData.logo)
      }

      if (applicationData.banner instanceof File) {
        formData.append('banner', applicationData.banner)
      }

      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.REAPPLY, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      })

      return {
        success: true,
        data: {
          requestId: response.data.requestId,
          message: response.data.message
        },
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Reapply application error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Application resubmission failed",
      }
    }
  }

  async setPassword(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.SET_PASSWORD, {
        email: email.trim().toLowerCase(),
        password
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Set password error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Password setting failed",
      }
    }
  }

  async verifyOtp(email: string, otp: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.VERIFY_OTP, {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Verify OTP error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "OTP verification failed",
      }
    }
  }

  async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.RESEND_OTP, {
        email: email.trim().toLowerCase()
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Resend OTP error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to resend OTP",
      }
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.LOGIN, {
        email: email.trim().toLowerCase(),
        password
      })
      return {
        success: true,
        data: {
          communityAdmin: response.data.communityAdmin,
          token: response.data.accessToken || response.data.token,
        },
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Community admin login error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Login failed",
      }
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await api.post(COMMUNITY_ADMIN_API_ROUTES.LOGOUT)
      return { success: true }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Community admin logout error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Logout failed",
      }
    }
  }

  async refreshToken(): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.REFRESH_TOKEN)
      return {
        success: true,
        data: {
          accessToken: response.data.accessToken
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Refresh token error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Token refresh failed",
      }
    }
  }

  // Forgot Password Flow
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.FORGOT_PASSWORD, {
        email: email.trim().toLowerCase()
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Forgot password error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to send reset code",
      }
    }
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.VERIFY_FORGOT_PASSWORD_OTP, {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Verify forgot password OTP error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Invalid OTP",
      }
    }
  }

  async resetPassword(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.RESET_PASSWORD, {
        email: email.trim().toLowerCase(),
        password
      })
      return {
        success: true,
        message: response.data.message,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Reset password error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Password reset failed",
      }
    }
  }

  // Profile
  async getProfile(): Promise<ApiResponse> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.PROFILE)
      return {
        success: true,
        data: {
          communityAdmin: response.data.communityAdmin,
        },
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Get profile error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get profile",
      }
    }
  }

  // Community Management
  async getCommunityDetails(): Promise<ApiResponse<{ community: CommunityDetails }>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.COMMUNITY)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Get community details error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get community details",
      }
    }
  }

  async updateCommunity(formData: FormData): Promise<ApiResponse> {
    try {
      const response = await api.put(COMMUNITY_ADMIN_API_ROUTES.COMMUNITY, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return {
        success: true,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Update community error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to update community",
      }
    }
  }

  async getCommunityMembers(page: number = 1, limit: number = 20): Promise<ApiResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.COMMUNITY_MEMBERS}?page=${page}&limit=${limit}`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Get community members error:", axiosError.response?.data || axiosError.message)
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get community members",
      }
    }
  }
}

export const communityAdminApiService = new CommunityAdminApiService()
export default communityAdminApiService