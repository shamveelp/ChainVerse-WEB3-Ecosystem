import api from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { MarketCoin } from "@/types/user/market.types";

export const getUserListedCoins = async (): Promise<MarketCoin[]> => {
  const response = await api.get(USER_API_ROUTES.MARKET_COINS);
  return response.data.coins || [];
};


