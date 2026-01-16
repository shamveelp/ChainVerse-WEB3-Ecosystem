import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from "class-validator";
import { BaseResponseDto } from "../base/BaseResponse.dto";
import { Type } from "class-transformer";
import { ISwapTransaction } from "../../models/dexSwap.model";

// Request DTOs
export class RecordSwapDto {
  @IsString()
  txHash!: string;

  @IsString()
  walletAddress!: string;

  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  fromToken!: 'ETH' | 'CoinA' | 'CoinB';

  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  toToken!: 'ETH' | 'CoinA' | 'CoinB';

  @IsString()
  fromAmount!: string;

  @IsString()
  toAmount!: string;

  @IsString()
  actualFromAmount!: string;

  @IsString()
  actualToAmount!: string;

  @IsNumber()
  @Type(() => Number)
  exchangeRate!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(50)
  slippage!: number;

  @IsString()
  gasUsed!: string;

  @IsString()
  gasFee!: string;

  @IsNumber()
  @Type(() => Number)
  blockNumber!: number;

  @IsNumber()
  @Type(() => Number)
  priceImpact!: number;
}

export class GetSwapHistoryDto {
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  fromToken?: 'ETH' | 'CoinA' | 'CoinB';

  @IsOptional()
  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  toToken?: 'ETH' | 'CoinA' | 'CoinB';

  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class GetChartDataDto {
  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  baseToken!: 'ETH' | 'CoinA' | 'CoinB';

  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  quoteToken!: 'ETH' | 'CoinA' | 'CoinB';

  @IsEnum(['1h', '4h', '1d', '7d', '1m'])
  timeframe!: '1h' | '4h' | '1d' | '7d' | '1m';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class UpdatePriceDto {
  @IsEnum(['ETH', 'CoinA', 'CoinB'])
  token!: 'ETH' | 'CoinA' | 'CoinB';

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceInETH!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceInUSD!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  volume24h?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  liquidity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  blockNumber?: number;
}

// Interfaces for constructor data
export interface IChartDataPoint {
  timestamp: Date | number | string;
  price?: number;
  close?: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface ITradingStats {
  symbol?: string;
  baseToken?: string;
  quoteToken?: string;
  currentPrice?: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  totalLiquidity?: number;
  totalTrades?: number;
  marketCap?: number;
}

export interface ITokenPriceData {
  token: string;
  priceInETH: number;
  priceInUSD: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  liquidity: number;
  timestamp: Date;
}

export interface IDexOverallStats {
  totalVolumeUSD?: number;
  totalTrades?: number;
  activeUsers24h?: number;
  topGainer?: {
    token: string;
    change: number;
  };
  topLoser?: {
    token: string;
    change: number;
  };
}

export interface IUserTradingStats {
  userId?: string;
  totalVolumeUSD?: number;
  totalTrades?: number;
  mostTradedToken?: string;
  profitAndLossUSD?: number;
  lastTradeAt?: Date;
}

// Response DTOs
export class SwapTransactionResponseDto extends BaseResponseDto {
  id: string;
  userId: string;
  walletAddress: string;
  txHash: string;
  fromToken: 'ETH' | 'CoinA' | 'CoinB';
  toToken: 'ETH' | 'CoinA' | 'CoinB';
  fromAmount: string;
  toAmount: string;
  actualFromAmount: string;
  actualToAmount: string;
  exchangeRate: number;
  slippage: number;
  gasUsed: string;
  gasFee: string;
  status: 'pending' | 'completed' | 'failed';
  blockNumber: number;
  timestamp: Date;
  priceImpact: number;
  volume24h?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(transaction: ISwapTransaction) {
    super(true, "Swap transaction retrieved successfully");
    this.id = transaction._id.toString();
    this.userId = transaction.userId.toString();
    this.walletAddress = transaction.walletAddress;
    this.txHash = transaction.txHash;
    this.fromToken = transaction.fromToken;
    this.toToken = transaction.toToken;
    this.fromAmount = transaction.fromAmount;
    this.toAmount = transaction.toAmount;
    this.actualFromAmount = transaction.actualFromAmount;
    this.actualToAmount = transaction.actualToAmount;
    this.exchangeRate = transaction.exchangeRate;
    this.slippage = transaction.slippage;
    this.gasUsed = transaction.gasUsed;
    this.gasFee = transaction.gasFee;
    this.status = transaction.status;
    this.blockNumber = transaction.blockNumber;
    this.timestamp = transaction.timestamp;
    this.priceImpact = transaction.priceImpact;
    this.volume24h = transaction.volume24h;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
  }
}

export class ChartDataPointDto {
  timestamp: number;
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;

  constructor(data: IChartDataPoint) {
    this.timestamp = new Date(data.timestamp).getTime();
    this.date = new Date(data.timestamp).toLocaleDateString();
    this.price = (data.price !== undefined ? data.price : data.close) || 0;
    this.volume = data.volume || 0;
    this.high = (data.high !== undefined ? data.high : (data.price || 0));
    this.low = (data.low !== undefined ? data.low : (data.price || 0));
    this.open = (data.open !== undefined ? data.open : (data.price || 0));
    this.close = (data.close !== undefined ? data.close : (data.price || 0));
  }
}

export class ChartDataResponseDto extends BaseResponseDto {
  data: ChartDataPointDto[];
  pair: string;
  timeframe: string;
  totalCount: number;

  constructor(data: IChartDataPoint[], pair: string, timeframe: string) {
    super(true, "Chart data retrieved successfully");
    this.data = data.map(item => new ChartDataPointDto(item));
    this.pair = pair;
    this.timeframe = timeframe;
    this.totalCount = data.length;
  }
}

export class TradingStatsDto {
  pair: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  totalLiquidity: number;
  totalTrades: number;
  marketCap: number;

  constructor(data: ITradingStats) {
    this.pair = data.symbol || `${data.baseToken}/${data.quoteToken}`;
    this.currentPrice = data.currentPrice || 0;
    this.priceChange24h = data.priceChange24h || 0;
    this.priceChangePercent24h = data.priceChangePercent24h || 0;
    this.volume24h = data.volume24h || 0;
    this.high24h = data.high24h || 0;
    this.low24h = data.low24h || 0;
    this.totalLiquidity = data.totalLiquidity || 0;
    this.totalTrades = data.totalTrades || 0;
    this.marketCap = data.marketCap || 0;
  }
}

export class SwapHistoryResponseDto extends BaseResponseDto {
  transactions: SwapTransactionResponseDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(transactions: ISwapTransaction[], pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  }) {
    super(true, "Swap history retrieved successfully");
    this.transactions = transactions.map(tx => new SwapTransactionResponseDto(tx));
    this.pagination = pagination;
  }
}

export class TokenPriceResponseDto extends BaseResponseDto {
  token: string;
  priceInETH: number;
  priceInUSD: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  liquidity: number;
  lastUpdated: Date;

  constructor(price: ITokenPriceData) {
    super(true, "Token price retrieved successfully");
    this.token = price.token;
    this.priceInETH = price.priceInETH;
    this.priceInUSD = price.priceInUSD;
    this.priceChange24h = price.priceChange24h;
    this.priceChangePercent24h = price.priceChangePercent24h;
    this.volume24h = price.volume24h;
    this.high24h = price.high24h;
    this.low24h = price.low24h;
    this.marketCap = price.marketCap;
    this.liquidity = price.liquidity;
    this.lastUpdated = price.timestamp;
  }
}

export class DexOverallStatsDto extends BaseResponseDto {
  totalVolumeUSD!: number;
  totalTrades!: number;
  activeUsers24h!: number;
  topGainer!: {
    token: string;
    change: number;
  };
  topLoser!: {
    token: string;
    change: number;
  };

  constructor(stats: IDexOverallStats) {
    super(true, "Overall DEX stats retrieved successfully");
    this.totalVolumeUSD = stats.totalVolumeUSD || 0;
    this.totalTrades = stats.totalTrades || 0;
    this.activeUsers24h = stats.activeUsers24h || 0;
    this.topGainer = stats.topGainer || { token: 'N/A', change: 0 };
    this.topLoser = stats.topLoser || { token: 'N/A', change: 0 };
  }
}

export class UserTradingStatsDto extends BaseResponseDto {
  userId!: string;
  totalVolumeUSD!: number;
  totalTrades!: number;
  mostTradedToken!: string;
  profitAndLossUSD!: number;
  lastTradeAt?: Date;

  constructor(stats: IUserTradingStats) {
    super(true, "User trading stats retrieved successfully");
    this.userId = stats.userId?.toString() || '';
    this.totalVolumeUSD = stats.totalVolumeUSD || 0;
    this.totalTrades = stats.totalTrades || 0;
    this.mostTradedToken = stats.mostTradedToken || 'N/A';
    this.profitAndLossUSD = stats.profitAndLossUSD || 0;
    this.lastTradeAt = stats.lastTradeAt;
  }
}