import API from "@/lib/api-client";
import { store } from "@/redux/store";
import { login, logout, setLoading } from "@/redux/slices/userAuthSlice";

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  refferalCode: string;
  refferedBy: string;
  profilePic: string;
  role: "user";
  totalPoints: number;
  isBlocked: boolean;
  isBanned: boolean;
  tokenVersion?: number;
  isEmailVerified: boolean;
  isGoogleUser: boolean;
  dailyCheckin: {
    lastCheckIn: Date | null;
    streak: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const userApiService = {
  getProfile: async (): Promise<{ data: UserProfile }> => {
    try {
      const response = await API.get("/api/user/get-profile");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          data: {
            _id: data._id,
            username: data.username,
            name: data.name || "",
            email: data.email,
            phone: data.phone,
            refferalCode: data.refferalCode || "",
            refferedBy: data.refferedBy || "",
            profilePic: data.profilePic || "",
            role: data.role || "user",
            totalPoints: data.totalPoints || 0,
            isBlocked: data.isBlocked || false,
            isBanned: data.isBanned || false,
            tokenVersion: data.tokenVersion,
            isEmailVerified: data.isEmailVerified || false,
            isGoogleUser: data.isGoogleUser || false,
            dailyCheckin: {
              lastCheckIn: data.dailyCheckin?.lastCheckIn ? new Date(data.dailyCheckin.lastCheckIn) : null,
              streak: data.dailyCheckin?.streak || 0,
            },
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          },
        };
      }
      throw new Error(response.data.error || "Failed to fetch profile");
    } catch (error: any) {
      console.error("Get profile error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "Failed to fetch profile";
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (profileData: {
    name: string;
    username: string;
    phone?: string;
    profilePic?: string;
  }) => {
    try {
      const response = await API.put("/api/user/profile", profileData);
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            _id: response.data.data._id,
            username: response.data.data.username,
            email: response.data.data.email,
            profileImage: response.data.data.profilePic,
            name: response.data.data.name,
            phone: response.data.data.phone,
            createdAt: response.data.data.createdAt,
            stats: response.data.data.stats,
          },
          message: "Profile updated successfully",
        };
      }
      return { success: false, error: response.data.error || "Failed to update profile" };
    } catch (error: any) {
      console.error("Update profile error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to update profile",
      };
    }
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const response = await API.post("/api/user/check-username", { username });
      return {
        success: true,
        available: response.data.available,
      };
    } catch (error: any) {
      console.error("Username check error:", error.response?.data || error.message);
      return {
        success: false,
        available: false,
        error: error.response?.data?.error || error.message || "Failed to check username",
      };
    }
  },

  uploadProfileImage: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await API.post("/api/user/upload-profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        imageUrl: response.data.imageUrl,
      };
    } catch (error: any) {
      console.error("Upload image error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to upload image",
      };
    }
  },
  
};