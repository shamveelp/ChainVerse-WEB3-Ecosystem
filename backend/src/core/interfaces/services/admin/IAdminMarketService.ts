import { ICoin } from "../../../../models/coins.model";

export interface AdminCoinListResult {
  coins: ICoin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAdminMarketService {
  getCoins(
    page: number,
    limit: number,
    search?: string,
    includeUnlisted?: boolean
  ): Promise<AdminCoinListResult>;

  toggleCoinListing(
    contractAddress: string,
    isListed: boolean
  ): Promise<ICoin>;

  createCoinFromExternal(
    data: {
      symbol: string;
      name: string;
      priceUSD?: number;
      volume24h?: string;
      marketCap?: string;
      network?: string;
    },
    adminId: string
  ): Promise<ICoin>;

  deleteCoin(contractAddress: string): Promise<void>;
}


