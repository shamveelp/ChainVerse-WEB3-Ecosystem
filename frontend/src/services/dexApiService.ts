import axios from 'axios';
import API from "@/lib/api-client";
import { USER_API_ROUTES, ADMIN_API_ROUTES } from "@/routes";

export const dexApiService = {
  // Get ETH price
  getEthPrice: async () => {
    const response = await API.get(USER_API_ROUTES.DEX_ETH_PRICE);
    return response.data;
  },

  // Calculate estimate
  calculateEstimate: async (amount: number, currency: string = 'INR') => {
    const response = await API.post(USER_API_ROUTES.DEX_CALCULATE_ESTIMATE, {
      amount,
      currency
    });
    return response.data;
  },

  // Create payment order
  createPaymentOrder: async (orderData: {
    walletAddress: string;
    currency: string;
    amountInCurrency: number;
    estimatedEth: number;
    ethPriceAtTime: number;
  }) => {
    const response = await API.post(USER_API_ROUTES.DEX_CREATE_ORDER, orderData);
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await API.post(USER_API_ROUTES.DEX_VERIFY_PAYMENT, paymentData);
    return response.data;
  },

  // Get user payments
  getUserPayments: async (page: number = 1, limit: number = 10) => {
    const response = await API.get(`${USER_API_ROUTES.DEX_PAYMENTS}?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export const adminDexApiService = {
  // Get all payments
  getAllPayments: async (page: number = 1, limit: number = 10, status?: string) => {
    const url = `${ADMIN_API_ROUTES.DEX_PAYMENTS}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    const response = await API.get(url);
    return response.data;
  },

  // Approve payment (deprecated - use fulfillPayment instead)
  approvePayment: async (paymentId: string, adminNote?: string, transactionHash?: string) => {
    const response = await API.post(ADMIN_API_ROUTES.DEX_APPROVE_PAYMENT, {
      paymentId,
      adminNote,
      transactionHash
    });
    return response.data;
  },

  // Reject payment
  rejectPayment: async (paymentId: string, reason: string) => {
    const response = await API.post(ADMIN_API_ROUTES.DEX_REJECT_PAYMENT, {
      paymentId,
      reason
    });
    return response.data;
  },

  // Fulfill payment (this is what should be used for approval)
  fulfillPayment: async (paymentId: string, transactionHash: string, adminNote?: string) => {
    const response = await API.post(ADMIN_API_ROUTES.DEX_FULFILL_PAYMENT, {
      paymentId,
      transactionHash,
      adminNote
    });
    return response.data;
  },

  // Get payment stats
  getPaymentStats: async () => {
    const response = await API.get(ADMIN_API_ROUTES.DEX_STATS);
    return response.data;
  },

  // Get pending payments
  getPendingPayments: async () => {
    const response = await API.get(ADMIN_API_ROUTES.DEX_PENDING);
    return response.data;
  },
};