import {
  RecordSwapDto,
  GetSwapHistoryDto,
  GetChartDataDto,
  UpdatePriceDto,
  SwapTransactionResponseDto,
  ChartDataResponseDto,
  SwapHistoryResponseDto,
  TradingStatsDto,
  TokenPriceResponseDto
} from "../../../../dtos/dex/DexSwap.dto";

export interface IDexSwapService {
  // Swap Transaction Services
  recordSwapTransaction(userId: string, swapData: RecordSwapDto): Promise<SwapTransactionResponseDto>;
  updateSwapStatus(txHash: string, status: 'completed' | 'failed'): Promise<SwapTransactionResponseDto>;
  getUserSwapHistory(userId: string, filters: GetSwapHistoryDto): Promise<SwapHistoryResponseDto>;
  getSwapTransaction(txHash: string): Promise<SwapTransactionResponseDto>;

  // Chart and Price Services
  getChartData(chartQuery: GetChartDataDto): Promise<ChartDataResponseDto>;
  updateTokenPrice(priceData: UpdatePriceDto): Promise<TokenPriceResponseDto>;
  getTokenPrice(token: string): Promise<TokenPriceResponseDto>;

  // Trading Statistics
  getTradingPairStats(baseToken: string, quoteToken: string): Promise<TradingStatsDto>;
  getOverallDEXStats(): Promise<any>;
  getUserTradingStats(userId: string): Promise<any>;

  // Market Data
  getTopTradingPairs(): Promise<TradingStatsDto[]>;
  getRecentSwaps(limit?: number): Promise<SwapTransactionResponseDto[]>;

  // Price Updates (Background Services)
  updateAllTokenPrices(): Promise<void>;
  calculateAndUpdateTradingPairStats(): Promise<void>;
}