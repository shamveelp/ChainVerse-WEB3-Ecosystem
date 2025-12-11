import API from "@/lib/api-client";
import { MarketCoin } from "@/types/user/market.types";
import { ADMIN_API_ROUTES } from "../../routes/api.routes";

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

  const response = await API.get(`${ADMIN_API_ROUTES.MARKET_COINS}?${params.toString()}`);
  return response.data as AdminMarketCoinsResponse;
};

export const toggleAdminCoinListing = async (
  contractAddress: string,
  isListed: boolean
): Promise<MarketCoin> => {
  const response = await API.patch(
    ADMIN_API_ROUTES.MARKET_COIN_LISTING(contractAddress),
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
  const response = await API.post(ADMIN_API_ROUTES.MARKET_COINS, payload);
  return response.data.coin as MarketCoin;
};

export const deleteAdminCoin = async (contractAddress: string): Promise<void> => {
  await API.delete(ADMIN_API_ROUTES.MARKET_COIN_BY_ADDRESS(contractAddress));
};


