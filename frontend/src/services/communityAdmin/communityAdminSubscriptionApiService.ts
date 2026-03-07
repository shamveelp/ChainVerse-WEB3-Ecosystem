import { AxiosError } from 'axios';
import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

import {
  Subscription,
  RazorpayOrder,
  VerifyPaymentData
} from "@/types/comms-admin/subscription.types";
import { ApiResponse } from "@/types/common.types";

interface ApiErrorResponse {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

class CommunityAdminSubscriptionApiService {
  async createOrder(communityId: string): Promise<ApiResponse<RazorpayOrder>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_CREATE_ORDER, { communityId });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Create subscription order error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to create subscription order",
      };
    }
  }

  async verifyPayment(paymentData: VerifyPaymentData): Promise<ApiResponse<Subscription>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_VERIFY_PAYMENT, paymentData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Verify subscription payment error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to verify payment",
      };
    }
  }

  async getSubscription(): Promise<ApiResponse<Subscription>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      // Handle 404 (subscription not found) gracefully without logging as error
      if (axiosError.response?.status === 404) {
        return {
          success: true,
          data: undefined,
          message: "No subscription found",
        };
      }

      console.error("Get subscription error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        url: COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION,
      });

      return {
        success: false,
        data: undefined,
        error:
          axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to fetch subscription",
      };
    }
  }

  async retryPayment(): Promise<ApiResponse<RazorpayOrder>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_RETRY_PAYMENT);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Retry payment error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to retry payment",
      };
    }
  }

  async getTimeRemaining(): Promise<ApiResponse<{ minutes: number; seconds: number }>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_TIME_REMAINING);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Get time remaining error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      return {
        success: false,
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to get time remaining",
      };
    }
  }

  async checkChainCastAccess(): Promise<ApiResponse<{ hasAccess: boolean; subscription?: Subscription }>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_CHAINCAST_ACCESS);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error("Check ChainCast access error:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      return {
        success: false,
        data: { hasAccess: false },
        error: axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to check ChainCast access",
      };
    }
  }
}

export const communityAdminSubscriptionApiService = new CommunityAdminSubscriptionApiService();
export default communityAdminSubscriptionApiService;