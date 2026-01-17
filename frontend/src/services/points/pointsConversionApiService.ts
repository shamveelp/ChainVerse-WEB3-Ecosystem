import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { USER_API_ROUTES, ADMIN_API_ROUTES } from "../../routes/api.routes";

import { ApiResponse } from "@/types/common.types";
import {
  ConversionRate,
  PointsConversion,
  ConversionStats
} from "@/types/points/conversion.types";

export type {
  ConversionRate,
  PointsConversion,
  ConversionStats,
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
      const response = await API.post(USER_API_ROUTES.POINTS_CONVERSION.CREATE, { pointsToConvert });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to create conversion");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Create conversion error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to create conversion",
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
      const response = await API.get(`${USER_API_ROUTES.POINTS_CONVERSION.HISTORY}?page=${page}&limit=${limit}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch conversions");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get conversions error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch conversions",
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
      const response = await API.post(USER_API_ROUTES.POINTS_CONVERSION.CLAIM, {
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
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Claim CVC error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to claim CVC",
      };
    }
  },

  getCurrentRate: async (): Promise<ApiResponse<ConversionRate>> => {
    try {
      const response = await API.get(USER_API_ROUTES.POINTS_CONVERSION.RATE);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get conversion rate");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get conversion rate error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to get conversion rate",
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
      const response = await API.get(`${USER_API_ROUTES.POINTS_CONVERSION.VALIDATE}?pointsToConvert=${pointsToConvert}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to validate conversion");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Validate conversion error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to validate conversion",
      };
    }
  },
};

// Admin APIs
export const adminPointsConversionApiService = {
  getAllConversions: async (page = 1, limit = 10, status?: string): Promise<ApiResponse<{
    conversions: PointsConversion[];
    total: number;
    totalPages: number;
  }>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);

      const response = await API.get(`${ADMIN_API_ROUTES.POINTS_CONVERSION.ALL}?${params}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to fetch conversions");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get admin conversions error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to fetch conversions",
      };
    }
  },

  approveConversion: async (conversionId: string, adminNote?: string): Promise<ApiResponse<PointsConversion>> => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.POINTS_CONVERSION.APPROVE(conversionId), { adminNote });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to approve conversion");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Approve conversion error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to approve conversion",
      };
    }
  },

  rejectConversion: async (conversionId: string, reason: string): Promise<ApiResponse<PointsConversion>> => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.POINTS_CONVERSION.REJECT(conversionId), { reason });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to reject conversion");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Reject conversion error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to reject conversion",
      };
    }
  },

  getConversionStats: async (): Promise<ApiResponse<ConversionStats>> => {
    try {
      const response = await API.get(ADMIN_API_ROUTES.POINTS_CONVERSION.STATS);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get stats");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get conversion stats error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to get stats",
      };
    }
  },

  getConversionById: async (conversionId: string): Promise<ApiResponse<PointsConversion>> => {
    try {
      const response = await API.get(ADMIN_API_ROUTES.POINTS_CONVERSION.BY_ID(conversionId));

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get conversion");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get conversion error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to get conversion",
      };
    }
  },

  updateConversionRate: async (rateData: {
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    effectiveFrom?: Date;
  }): Promise<ApiResponse<ConversionRate>> => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.POINTS_CONVERSION.RATE_UPDATE, rateData);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to update rate");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Update conversion rate error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to update rate",
      };
    }
  },

  getConversionRates: async (page = 1, limit = 10): Promise<ApiResponse<{
    rates: ConversionRate[];
    total: number;
    totalPages: number;
  }>> => {
    try {
      const response = await API.get(`${ADMIN_API_ROUTES.POINTS_CONVERSION.RATES}?page=${page}&limit=${limit}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get rates");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get conversion rates error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to get rates",
      };
    }
  },

  getCurrentRate: async (): Promise<ApiResponse<ConversionRate>> => {
    try {
      const response = await API.get(ADMIN_API_ROUTES.POINTS_CONVERSION.RATE_CURRENT);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      throw new Error(response.data.error || "Failed to get current rate");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      console.error("Get admin current rate error:", axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to get current rate",
      };
    }
  },
};