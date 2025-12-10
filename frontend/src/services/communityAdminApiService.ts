import api from "@/lib/api-client"
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes"

// Types
interface CommunityApplicationData {
  communityName: string
  email: string
  username: string
  walletAddress: string
  description: string
  category: string
  whyChooseUs: string
  rules: string[]
  socialLinks: {
    twitter: string
    discord: string
    telegram: string
    website: string
  }
  logo: string | File | null
  banner: string | File | null
}

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface CommunitySettings {
  allowChainCast: boolean
  allowGroupChat: boolean
  allowPosts: boolean
  allowQuests: boolean
}

export interface CommunitySocialLinks {
  twitter?: string
  discord?: string
  telegram?: string
  website?: string
}

export interface CommunityDetails {
  id: string
  communityName: string
  email: string
  username: string
  walletAddress: string
  description: string
  category: string
  rules: string[]
  socialLinks: CommunitySocialLinks
  logo?: string
  banner?: string
  settings: CommunitySettings
  status: string
  isVerified: boolean
  memberCount: number
  createdAt?: string
  updatedAt?: string
}

interface CheckExistenceResponse {
  exists: boolean
  success: boolean
  message?: string
}

class CommunityAdminApiService {
  // private readonly baseUrl = '/api/community-admin'

  // Live validation endpoints
  async checkEmailExists(email: string): Promise<CheckExistenceResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.CHECK_EMAIL}?email=${encodeURIComponent(email)}`)
      return {
        exists: response.data.exists,
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error("Check email error:", error)
      throw new Error(error.response?.data?.message || error.message || "Failed to check email")
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
    } catch (error: any) {
      console.error("Check username error:", error)
      throw new Error(error.response?.data?.message || error.message || "Failed to check username")
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
        timeout: 30000, // 30 seconds timeout
      })

      return {
        success: true,
        data: {
          requestId: response.data.requestId,
          message: response.data.message
        },
        message: response.data.message
      }
    } catch (error: any) {
      console.error("Submit application error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })

      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
        timeout: 30000, // 30 seconds timeout
      })

      return {
        success: true,
        data: {
          requestId: response.data.requestId,
          message: response.data.message
        },
        message: response.data.message
      }
    } catch (error: any) {
      console.error("Reapply application error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Set password error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Verify OTP error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Resend OTP error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Community admin login error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Login failed",
      }
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await api.post(COMMUNITY_ADMIN_API_ROUTES.LOGOUT)
      return { success: true }
    } catch (error: any) {
      console.error("Community admin logout error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Refresh token error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Forgot password error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Verify forgot password OTP error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Reset password error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Get profile error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Get community details error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Update community error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Get community members error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get community members",
      }
    }
  }
}

export const communityAdminApiService = new CommunityAdminApiService()
export default communityAdminApiService