import api from "@/lib/api-client";

interface Subscription {
  communityId: string;
  plan: "lifetime";
  status: "active" | "inactive" | "pending";
  paymentId?: string;
  orderId?: string;
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
  private readonly baseUrl = '/api/community-admin';

  async createOrder(communityId: string): Promise<ApiResponse<RazorpayOrder>> {
    try {
      const response = await api.post(`${this.baseUrl}/subscription/create-order`, { communityId });
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
      const response = await api.post(`${this.baseUrl}/subscription/verify-payment`, paymentData);
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
      const response = await api.get(`${this.baseUrl}/subscription`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get subscription error:", error.response?.data || error.message);
      // Handle 404 (subscription not found) gracefully
      if (error.response?.status === 404) {
        return {
          success: true,
          data: undefined,
          message: "No subscription found",
        };
      }
      return {
        success: false,
        error: error.response?.data?.error ||
               error.response?.data?.message ||
               error.message ||
               "Failed to fetch subscription",
      };
    }
  }
}

export const communityAdminSubscriptionApiService = new CommunityAdminSubscriptionApiService();
export default communityAdminSubscriptionApiService;