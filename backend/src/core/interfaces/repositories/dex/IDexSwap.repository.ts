import { ISwapTransaction } from "../../../../models/dexSwap.model";
import { ITokenPrice } from "../../../../models/tokenPrice.model";
import { ITradingPair } from "../../../../models/tradingPair.model";

export interface ISwapFilters {
  walletAddress?: string;
  fromToken?: string;
  toToken?: string;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

export interface IPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IChartData {
  timestamp: Date;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface ITradingStats {
  totalVolume24h: number;
  totalTrades24h: number;
  activePairs: number;
  topPairs: ITradingPair[];
}

export interface IVolumeData {
  _id: string;
  volume: number;
  trades: number;
}

export interface IUserTradingStats {
  totalTrades: number;
  totalVolume: number;
  totalFees: number;
  avgSlippage: number;
  avgPriceImpact: number;
}

export interface IDEXOverallStats {
  totalTrades: number;
  totalVolume: number;
  trades24h: number;
  volume24h: number;
  uniqueUsers: number;
  totalLiquidity: number;
}

export interface IDexSwapRepository {
  // Swap Transaction Methods
  createSwapTransaction(swapData: Partial<ISwapTransaction>): Promise<ISwapTransaction>;
  updateSwapTransaction(txHash: string, updateData: Partial<ISwapTransaction>): Promise<ISwapTransaction | null>;
  getSwapTransactionByHash(txHash: string): Promise<ISwapTransaction | null>;
  getUserSwapHistory(userId: string, filters: ISwapFilters, pagination: IPagination): Promise<{
    transactions: ISwapTransaction[];
    total: number;
  }>;
  getSwapsByPair(fromToken: string, toToken: string, limit: number): Promise<ISwapTransaction[]>;
  getRecentSwaps(limit: number): Promise<ISwapTransaction[]>;

  // Token Price Methods
  createTokenPrice(priceData: Partial<ITokenPrice>): Promise<ITokenPrice>;
  getLatestTokenPrice(token: string): Promise<ITokenPrice | null>;
  getTokenPriceHistory(token: string, fromDate: Date, toDate: Date): Promise<ITokenPrice[]>;
  getTokenPricesForChart(
    baseToken: string,
    quoteToken: string,
    timeframe: string,
    limit: number
  ): Promise<IChartData[]>;
  updateTokenPrice(token: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice | null>;

  // Trading Pair Methods
  createTradingPair(pairData: Partial<ITradingPair>): Promise<ITradingPair>;
  getTradingPair(baseToken: string, quoteToken: string): Promise<ITradingPair | null>;
  updateTradingPair(baseToken: string, quoteToken: string, updateData: Partial<ITradingPair>): Promise<ITradingPair | null>;
  getAllTradingPairs(isActive?: boolean): Promise<ITradingPair[]>;
  getTradingStats(): Promise<ITradingStats>;

  // Analytics Methods
  getVolumeByTimeframe(timeframe: string): Promise<IVolumeData[]>;
  getTopTradingPairs(limit: number): Promise<ITradingPair[]>;
  getUserTradingStats(userId: string): Promise<IUserTradingStats>;
  getDEXOverallStats(): Promise<IDEXOverallStats>;
}