import axios from 'axios';
import API from "@/lib/api-client";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';



export const dexApiService = {
  // Get ETH price
  getEthPrice: async () => {
    const response = await API.get('/api/user/dex/eth-price');
    return response.data;
  },

  // Calculate estimate
  calculateEstimate: async (amount: number, currency: string = 'INR') => {
    const response = await API.post('/api/user/dex/calculate-estimate', {
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
    const response = await API.post('/api/user/dex/create-order', orderData);
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await API.post('/api/user/dex/verify-payment', paymentData);
    return response.data;
  },

  // Get user payments
  getUserPayments: async (page: number = 1, limit: number = 10) => {
    const response = await API.get(`/api/user/dex/payments?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export const adminDexApiService = {
  // Get all payments
  getAllPayments: async (page: number = 1, limit: number = 10, status?: string) => {
    const url = `/admin/dex/payments?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    const response = await API.get(url);
    return response.data;
  },

  // Approve payment
  approvePayment: async (paymentId: string, adminNote?: string, transactionHash?: string) => {
    const response = await API.post('/api/admin/dex/approve-payment', {
      paymentId,
      adminNote,
      transactionHash
    });
    return response.data;
  },

  // Reject payment
  rejectPayment: async (paymentId: string, reason: string) => {
    const response = await API.post('/api/admin/dex/reject-payment', {
      paymentId,
      reason
    });
    return response.data;
  },

  // Fulfill payment
  fulfillPayment: async (paymentId: string, transactionHash: string) => {
    const response = await API.post('/api/admin/dex/fulfill-payment', {
      paymentId,
      transactionHash
    });
    return response.data;
  },

  // Get payment stats
  getPaymentStats: async () => {
    const response = await API.get('/api/admin/dex/stats');
    return response.data;
  },

  // Get pending payments
  getPendingPayments: async () => {
    const response = await API.get('/api/admin/dex/pending');
    return response.data;
  },
};