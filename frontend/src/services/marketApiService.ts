import api from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { MarketCoin } from "@/types/user/market.types";
import { AxiosError } from "axios";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const getUserListedCoins = async (): Promise<MarketCoin[]> => {
  try {
    const response = await api.get(USER_API_ROUTES.MARKET_COINS);
    return response.data.coins || [];
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get user listed coins error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};
