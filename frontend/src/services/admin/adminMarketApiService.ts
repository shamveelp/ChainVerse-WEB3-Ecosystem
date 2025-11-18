import api from "@/lib/api-client";
import type { MarketCoin } from "@/services/marketApiService";

export interface AdminMarketCoinsResponse {
  success: boolean;
  message: string;
  coins: MarketCoin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAdminMarketCoins = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  includeUnlisted: boolean = true
): Promise<AdminMarketCoinsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    includeUnlisted: includeUnlisted ? "true" : "false",
  });

  const response = await api.get(`/api/admin/market/coins?${params.toString()}`);
  return response.data as AdminMarketCoinsResponse;
};

export const toggleAdminCoinListing = async (
  contractAddress: string,
  isListed: boolean
): Promise<MarketCoin> => {
  const response = await api.patch(
    `/api/admin/market/coins/${contractAddress}/listing`,
    { isListed }
  );
  return response.data.coin as MarketCoin;
};

export const addCoinFromTopList = async (payload: {
  symbol: string;
  name: string;
  priceUSD?: number;
  volume24h?: string;
  marketCap?: string;
  network?: string;
}): Promise<MarketCoin> => {
  const response = await api.post("/api/admin/market/coins", payload);
  return response.data.coin as MarketCoin;
};

export const deleteAdminCoin = async (contractAddress: string): Promise<void> => {
  await api.delete(`/api/admin/market/coins/${contractAddress}`);
};


