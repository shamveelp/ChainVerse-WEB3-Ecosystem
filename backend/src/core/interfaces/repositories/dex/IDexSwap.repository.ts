import { ISwapTransaction } from "../../../../models/dexSwap.model";
import { ITokenPrice } from "../../../../models/tokenPrice.model";
import { ITradingPair } from "../../../../models/tradingPair.model";

export interface IDexSwapRepository {
  // Swap Transaction Methods
  createSwapTransaction(swapData: Partial<ISwapTransaction>): Promise<ISwapTransaction>;
  updateSwapTransaction(txHash: string, updateData: Partial<ISwapTransaction>): Promise<ISwapTransaction | null>;
  getSwapTransactionByHash(txHash: string): Promise<ISwapTransaction | null>;
  getUserSwapHistory(userId: string, filters: any, pagination: any): Promise<{
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
  ): Promise<any[]>;
  updateTokenPrice(token: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice | null>;

  // Trading Pair Methods
  createTradingPair(pairData: Partial<ITradingPair>): Promise<ITradingPair>;
  getTradingPair(baseToken: string, quoteToken: string): Promise<ITradingPair | null>;
  updateTradingPair(baseToken: string, quoteToken: string, updateData: Partial<ITradingPair>): Promise<ITradingPair | null>;
  getAllTradingPairs(isActive?: boolean): Promise<ITradingPair[]>;
  getTradingStats(): Promise<any>;

  // Analytics Methods
  getVolumeByTimeframe(timeframe: string): Promise<any[]>;
  getTopTradingPairs(limit: number): Promise<ITradingPair[]>;
  getUserTradingStats(userId: string): Promise<any>;
  getDEXOverallStats(): Promise<any>;
}