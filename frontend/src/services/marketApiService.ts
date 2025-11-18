import api from "@/lib/api-client";

export interface MarketCoin {
  _id: string;
  name: string;
  symbol: string;
  ticker: string;
  contractAddress: string;
  network: string;
  isListed: boolean;
  logoUrl?: string;
  description?: string;
  priceUSD?: number;
  volume24h?: string;
  marketCap?: string;
  createdAt: string;
  updatedAt: string;
}

export const getUserListedCoins = async (): Promise<MarketCoin[]> => {
  const response = await api.get("/api/user/market/coins/public");
  return response.data.coins || [];
};


