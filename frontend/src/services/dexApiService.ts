import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { USER_API_ROUTES, ADMIN_API_ROUTES } from "@/routes";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const dexApiService = {
  // Get ETH price
  getEthPrice: async () => {
    try {
      const response = await API.get(USER_API_ROUTES.DEX_ETH_PRICE);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Get ETH price error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Calculate estimate
  calculateEstimate: async (amount: number, currency: string = 'INR') => {
    try {
      const response = await API.post(USER_API_ROUTES.DEX_CALCULATE_ESTIMATE, {
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Calculate estimate error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Create payment order
  createPaymentOrder: async (orderData: {
    walletAddress: string;
    currency: string;
    amountInCurrency: number;
    estimatedEth: number;
    ethPriceAtTime: number;
  }) => {
    try {
      const response = await API.post(USER_API_ROUTES.DEX_CREATE_ORDER, orderData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Create payment order error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      const response = await API.post(USER_API_ROUTES.DEX_VERIFY_PAYMENT, paymentData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Verify payment error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Get user payments
  getUserPayments: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await API.get(`${USER_API_ROUTES.DEX_PAYMENTS}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Get user payments error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },
};

export const adminDexApiService = {
  // Get all payments
  getAllPayments: async (page: number = 1, limit: number = 10, status?: string) => {
    try {
      const url = `${ADMIN_API_ROUTES.DEX_PAYMENTS}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Get all payments error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Approve payment (deprecated - use fulfillPayment instead)
  approvePayment: async (paymentId: string, adminNote?: string, transactionHash?: string) => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.DEX_APPROVE_PAYMENT, {
        paymentId,
        adminNote,
        transactionHash
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Approve payment error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Reject payment
  rejectPayment: async (paymentId: string, reason: string) => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.DEX_REJECT_PAYMENT, {
        paymentId,
        reason
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Reject payment error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Fulfill payment (this is what should be used for approval)
  fulfillPayment: async (paymentId: string, transactionHash: string, adminNote?: string) => {
    try {
      const response = await API.post(ADMIN_API_ROUTES.DEX_FULFILL_PAYMENT, {
        paymentId,
        transactionHash,
        adminNote
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Fulfill payment error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Get payment stats
  getPaymentStats: async () => {
    try {
      const response = await API.get(ADMIN_API_ROUTES.DEX_STATS);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Get payment stats error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },

  // Get pending payments
  getPendingPayments: async () => {
    try {
      const response = await API.get(ADMIN_API_ROUTES.DEX_PENDING);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorData>;
      console.error("Get pending payments error:", axiosError.response?.data || axiosError.message);
      throw axiosError;
    }
  },
};