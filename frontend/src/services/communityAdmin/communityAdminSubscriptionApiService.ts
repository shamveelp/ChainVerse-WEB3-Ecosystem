import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

interface Subscription {
  communityId: string;
  plan: "lifetime";
  status: "active" | "inactive" | "pending" | "failed" | "expired";
  paymentId?: string;
  orderId?: string;
  expiresAt?: Date;
  failedAt?: Date;
  retryCount?: number;
  timeRemaining?: {
    minutes: number;
    seconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T | null;
}

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
    } catch (error: any) {
      console.error("Create subscription order error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Verify subscription payment error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Get subscription error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: COMMUNITY_ADMIN_API_ROUTES.SUBSCRIPTION
      });
      // Handle 404 (subscription not found) gracefully
      if (error.response?.status === 404) {
        return {
          success: true,
          data: undefined, // Explicitly return undefined for data
          message: "No subscription found",
        };
      }
      return {
        success: false,
        data: null, // Ensure data is null on error
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Retry payment error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Get time remaining error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
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
    } catch (error: any) {
      console.error("Check ChainCast access error:", error.response?.data || error.message);
      return {
        success: false,
        data: { hasAccess: false },
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to check ChainCast access",
      };
    }
  }
}

export const communityAdminSubscriptionApiService = new CommunityAdminSubscriptionApiService();
export default communityAdminSubscriptionApiService;