import { AxiosError } from "axios";
import API from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const walletService = {
  connectWallet: async () => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const walletAddress = accounts[0];

        const response = await API.post(USER_API_ROUTES.CONNECT_WALLET, {
          walletAddress,
        });

        return {
          success: true,
          data: response.data.data,
          walletAddress,
        };
      } else {
        throw new Error("MetaMask is not installed");
      }
    } catch (error) {
      console.error("Connect wallet error:", error);
      const axiosError = error as AxiosError<ApiErrorData>;
      return {
        success: false,
        message: axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to connect wallet",
      };
    }
  },

  getWalletBalance: async (_address: string) => {
    // Basic implementation for now
    return "0.00";
  }
};
