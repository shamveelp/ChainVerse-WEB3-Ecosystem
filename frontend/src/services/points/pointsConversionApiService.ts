import API from "@/lib/api-client";

export interface ConversionRate {
  pointsPerCVC: number;
  minimumPoints: number;
  minimumCVC: number;
  claimFeeETH: string;
  isActive: boolean;
}

export interface PointsConversion {
  id: string;
  pointsConverted: number;
  cvcAmount: number;
  conversionRate: number;
  status: 'pending' | 'approved' | 'rejected' | 'claimed';
  transactionHash?: string;
  claimFee: number;
  walletAddress?: string;
  adminNote?: string;
  approvedBy?: any;
  approvedAt?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface ConversionStats {
  totalPointsConverted: number;
  totalCVCClaimed: number;
  pendingConversions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const pointsConversionApiService = {
  // User APIs
  createConversion: async (pointsToConvert: number): Promise<ApiResponse<{
    success: boolean;
    conversionId: string;
    cvcAmount: number;
    message: string;
  }>> => {
    try {
      const response = await API.post("/api/user/points-conversion/create", { pointsToConvert });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to create conversion");
    } catch (error: any) {
      console.error("Create conversion error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to create conversion",
      };
    }
  },

  getUserConversions: async (page = 1, limit = 10): Promise<ApiResponse<{
    conversions: PointsConversion[];
    total: number;
    totalPages: number;
    stats: ConversionStats;
  }>> => {
    try {
      const response = await API.get(`/api/user/points-conversion/history?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch conversions");
    } catch (error: any) {
      console.error("Get conversions error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch conversions",
      };
    }
  },

  claimCVC: async (
    conversionId: string,
    walletAddress: string,
    transactionHash: string
  ): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> => {
    try {
      const response = await API.post("/api/user/points-conversion/claim", {
        conversionId,
        walletAddress,
        transactionHash
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to claim CVC");
    } catch (error: any) {
      console.error("Claim CVC error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to claim CVC",
      };
    }
  },

  getCurrentRate: async (): Promise<ApiResponse<ConversionRate>> => {
    try {
      const response = await API.get("/api/user/points-conversion/rate");
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get conversion rate");
    } catch (error: any) {
      console.error("Get conversion rate error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to get conversion rate",
      };
    }
  },

  validateConversion: async (pointsToConvert: number): Promise<ApiResponse<{
    isValid: boolean;
    error?: string;
    cvcAmount?: number;
    userPoints?: number;
  }>> => {
    try {
      const response = await API.get(`/api/user/points-conversion/validate?pointsToConvert=${pointsToConvert}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to validate conversion");
    } catch (error: any) {
      console.error("Validate conversion error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to validate conversion",
      };
    }
  },
};

// Admin APIs
export const adminPointsConversionApiService = {
  getAllConversions: async (page = 1, limit = 10, status?: string): Promise<ApiResponse<{
    conversions: any[];
    total: number;
    totalPages: number;
  }>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);
      
      const response = await API.get(`/api/admin/points-conversion/all?${params}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch conversions");
    } catch (error: any) {
      console.error("Get admin conversions error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to fetch conversions",
      };
    }
  },

  approveConversion: async (conversionId: string, adminNote?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await API.post(`/api/admin/points-conversion/${conversionId}/approve`, { adminNote });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to approve conversion");
    } catch (error: any) {
      console.error("Approve conversion error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to approve conversion",
      };
    }
  },

  rejectConversion: async (conversionId: string, reason: string): Promise<ApiResponse<any>> => {
    try {
      const response = await API.post(`/api/admin/points-conversion/${conversionId}/reject`, { reason });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to reject conversion");
    } catch (error: any) {
      console.error("Reject conversion error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to reject conversion",
      };
    }
  },

  getConversionStats: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await API.get("/api/admin/points-conversion/stats");
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get stats");
    } catch (error: any) {
      console.error("Get conversion stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to get stats",
      };
    }
  },

  getConversionById: async (conversionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await API.get(`/api/admin/points-conversion/${conversionId}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get conversion");
    } catch (error: any) {
      console.error("Get conversion error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to get conversion",
      };
    }
  },

  updateConversionRate: async (rateData: {
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    effectiveFrom?: Date;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await API.post("/api/admin/points-conversion/rate/update", rateData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to update rate");
    } catch (error: any) {
      console.error("Update conversion rate error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to update rate",
      };
    }
  },

  getConversionRates: async (page = 1, limit = 10): Promise<ApiResponse<any>> => {
    try {
      const response = await API.get(`/api/admin/points-conversion/rates?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get rates");
    } catch (error: any) {
      console.error("Get conversion rates error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to get rates",
      };
    }
  },

  getCurrentRate: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await API.get("/api/admin/points-conversion/rate/current");
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get current rate");
    } catch (error: any) {
      console.error("Get admin current rate error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to get current rate",
      };
    }
  },
};