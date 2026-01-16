import { AxiosError } from 'axios';
import API from "@/lib/api-client";
import { MarketCoin } from "@/types/user/market.types";
import { ADMIN_API_ROUTES } from "../../routes/api.routes";
import { AdminMarketCoinsResponse } from "@/types/admin/market.types";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const getAdminMarketCoins = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  includeUnlisted: boolean = true
): Promise<AdminMarketCoinsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      includeUnlisted: includeUnlisted ? "true" : "false",
    });

    const response = await API.get(`${ADMIN_API_ROUTES.MARKET_COINS}?${params.toString()}`);
    return response.data as AdminMarketCoinsResponse;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Get admin market coins error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const toggleAdminCoinListing = async (
  contractAddress: string,
  isListed: boolean
): Promise<MarketCoin> => {
  try {
    const response = await API.patch(
      ADMIN_API_ROUTES.MARKET_COIN_LISTING(contractAddress),
      { isListed }
    );
    return response.data.coin as MarketCoin;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Toggle admin coin listing error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const addCoinFromTopList = async (payload: {
  symbol: string;
  name: string;
  priceUSD?: number;
  volume24h?: string;
  marketCap?: string;
  network?: string;
}): Promise<MarketCoin> => {
  try {
    const response = await API.post(ADMIN_API_ROUTES.MARKET_COINS, payload);
    return response.data.coin as MarketCoin;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Add coin from top list error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};

export const deleteAdminCoin = async (contractAddress: string): Promise<void> => {
  try {
    await API.delete(ADMIN_API_ROUTES.MARKET_COIN_BY_ADDRESS(contractAddress));
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorData>;
    console.error("Delete admin coin error:", axiosError.response?.data || axiosError.message);
    throw axiosError;
  }
};
