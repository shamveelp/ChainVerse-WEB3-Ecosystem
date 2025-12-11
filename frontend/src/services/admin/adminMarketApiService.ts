import API from "@/lib/api-client";
import { MarketCoin } from "@/types/user/market.types";

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

  const response = await API.get(`/api/admin/market/coins?${params.toString()}`);
  return response.data as AdminMarketCoinsResponse;
};

export const toggleAdminCoinListing = async (
  contractAddress: string,
  isListed: boolean
): Promise<MarketCoin> => {
  const response = await API.patch(
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
  const response = await API.post("/api/admin/market/coins", payload);
  return response.data.coin as MarketCoin;
};

export const deleteAdminCoin = async (contractAddress: string): Promise<void> => {
  await API.delete(`/api/admin/market/coins/${contractAddress}`);
};


