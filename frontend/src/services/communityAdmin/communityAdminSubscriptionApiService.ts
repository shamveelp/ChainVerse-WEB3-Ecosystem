import { AxiosError } from 'axios';
import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

import {
  Subscription,
  RazorpayOrder,
  VerifyPaymentData
} from "@/types/comms-admin/subscription.types";
import { ApiResponse } from "@/types/common.types";



class CommunityAdminSubscriptionApiService {
  // private readonly baseUrl = '/api/community-admin';

  async createOrder(communityId: string): Promise<ApiResponse<RazorpayOrder>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION_CREATE_ORDER, { communityId });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Create subscription order error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
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
      console.error("Verify subscription payment error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
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
      console.error("Get subscription error:", {
        message: ((error as AxiosError).message),
        response: ((error as AxiosError).response?.data),
        status: ((error as AxiosError).response?.status),
        url: COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION
      });
      // Handle 404 (subscription not found) gracefully
      if (((error as AxiosError).response?.status) === 404) {
        return {
          success: true,
          data: undefined, // Explicitly return undefined for data
          message: "No subscription found",
        };
      }
      return {
        success: false,
        data: undefined, // Ensure data is undefined on error
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
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
      console.error("Retry payment error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
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
      console.error("Get time remaining error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
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
      console.error("Check ChainCast access error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        data: { hasAccess: false },
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
          "Failed to check ChainCast access",
      };
    }
  }
}

export const communityAdminSubscriptionApiService = new CommunityAdminSubscriptionApiService();
export default communityAdminSubscriptionApiService;