import API from "@/lib/api-client"

export const userApiService = {
  getProfile: async () => {
    try {
      const response = await API.get("/api/user/profile")
      return {
        success: true,
        data: response.data,
      }
    } catch (error: any) {
      console.error("Get profile error:", error.response?.data || error.message)
      return {
        success: false,
        error:
          error.response?.data?.error || error.response?.data?.message || error.message || "Failed to fetch profile",
      }
    }
  },

  updateProfile: async (profileData: {
    name: string
    username: string
    phone?: string
    profilePic?: string
  }) => {
    try {
      const response = await API.put("/api/user/profile", profileData)
      return {
        success: true,
        data: response.data,
        message: "Profile updated successfully",
      }
    } catch (error: any) {
      console.error("Update profile error:", error.response?.data || error.message)
      return {
        success: false,
        error:
          error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update profile",
      }
    }
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const response = await API.post("/api/user/check-username", { username })
      return {
        success: true,
        available: response.data.available,
      }
    } catch (error: any) {
      console.error("Username check error:", error.response?.data || error.message)
      return {
        success: false,
        available: false,
        error:
          error.response?.data?.error || error.response?.data?.message || error.message || "Failed to check username",
      }
    }
  },

  uploadProfileImage: async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("profileImage", file)

      const response = await API.post("/api/user/upload-profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      return {
        success: true,
        imageUrl: response.data.imageUrl,
      }
    } catch (error: any) {
      console.error("Upload image error:", error.response?.data || error.message)
      return {
        success: false,
        error:
          error.response?.data?.error || error.response?.data?.message || error.message || "Failed to upload image",
      }
    }
  },
}
