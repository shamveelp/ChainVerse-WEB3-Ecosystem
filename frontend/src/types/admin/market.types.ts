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
