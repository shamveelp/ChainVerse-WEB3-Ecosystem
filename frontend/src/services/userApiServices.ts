import API from "@/lib/api-client";

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
    lastCheckIn: Date | string | null;
    streak: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string;
  referralLink: string;
}

export interface CheckInStatus {
  hasCheckedInToday: boolean;
  currentStreak: number;
  nextCheckInAvailable: Date | null;
}

export interface DailyCheckInResult {
  success: boolean;
  pointsAwarded: number;
  streakCount: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const userApiService = {
  getProfile: async (): Promise<{ data: UserProfile }> => {
    try {
      console.log("Fetching profile...");
      const response = await API.get("/api/user/get-profile");
      console.log("Profile API response:", response.data);
      
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
              lastCheckIn: data.dailyCheckin?.lastCheckIn || null,
              streak: data.dailyCheckin?.streak || 0,
            },
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
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
  }): Promise<{ success: boolean; data?: any; error?: string; message?: string }> => {
    try {
      console.log("Updating profile...", profileData);
      const response = await API.put("/api/user/profile", profileData);
      console.log("Update profile API response:", response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            _id: data._id,
            username: data.username,
            email: data.email,
            profilePic: data.profilePic,
            name: data.name,
            phone: data.phone,
            createdAt: data.createdAt,
            stats: data.stats,
          },
          message: response.data.message || "Profile updated successfully",
        };
      }
      return { 
        success: false, 
        error: response.data.error || "Failed to update profile" 
      };
    } catch (error: any) {
      console.error("Update profile error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to update profile",
      };
    }
  },

  checkUsernameAvailability: async (username: string): Promise<{
    success: boolean;
    available: boolean;
    error?: string;
  }> => {
    try {
      if (!username || username.trim() === "") {
        return { success: false, available: false, error: "Username cannot be empty" };
      }
      
      console.log("Checking username availability:", username);
      const response = await API.post("/api/user/check-username", { username });
      console.log("Username check API response:", response.data);
      
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

  uploadProfileImage: async (file: File): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      console.log("Uploading profile image...");
      const response = await API.post("/api/user/upload-profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload image API response:", response.data);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            ...response.data.data,
            profilePic: response.data.data.profilePic,
          },
        };
      }
      return { 
        success: false, 
        error: response.data.error || "Failed to upload image" 
      };
    } catch (error: any) {
      console.error("Upload image error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to upload image",
      };
    }
  },

  // Referral API methods
  getReferralStats: async (): Promise<{ success: boolean; data?: ReferralStats; error?: string }> => {
    try {
      console.log("Fetching referral stats...");
      const response = await API.get("/api/user/referrals/stats");
      console.log("Referral stats API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch referral stats");
    } catch (error: any) {
      console.error("Get referral stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch referral stats",
      };
    }
  },

  getReferralHistory: async (page = 1, limit = 10): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      console.log("Fetching referral history...");
      const response = await API.get(`/api/user/referrals/history?page=${page}&limit=${limit}`);
      console.log("Referral history API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch referral history");
    } catch (error: any) {
      console.error("Get referral history error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch referral history",
      };
    }
  },

  // Points API methods
  performDailyCheckIn: async (): Promise<{ success: boolean; data?: DailyCheckInResult; error?: string }> => {
    try {
      console.log("Performing daily check-in...");
      const response = await API.post("/api/user/points/daily-checkin");
      console.log("Daily check-in API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to perform daily check-in");
    } catch (error: any) {
      console.error("Daily check-in error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to perform daily check-in",
      };
    }
  },

  getCheckInStatus: async (): Promise<{ success: boolean; data?: CheckInStatus; error?: string }> => {
    try {
      console.log("Fetching check-in status...");
      const response = await API.get("/api/user/points/checkin-status");
      console.log("Check-in status API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch check-in status");
    } catch (error: any) {
      console.error("Get check-in status error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch check-in status",
      };
    }
  },

  getCheckInCalendar: async (month: number, year: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      console.log("Fetching check-in calendar...");
      const response = await API.get(`/api/user/points/checkin-calendar?month=${month}&year=${year}`);
      console.log("Check-in calendar API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch check-in calendar");
    } catch (error: any) {
      console.error("Get check-in calendar error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch check-in calendar",
      };
    }
  },

  getPointsHistory: async (page = 1, limit = 10): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      console.log("Fetching points history...");
      const response = await API.get(`/api/user/points/history?page=${page}&limit=${limit}`);
      console.log("Points history API response:", response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch points history");
    } catch (error: any) {
      console.error("Get points history error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch points history",
      };
    }
  },
};