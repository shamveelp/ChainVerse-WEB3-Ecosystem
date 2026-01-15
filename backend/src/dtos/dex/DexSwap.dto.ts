import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from "class-validator";
import { BaseResponseDto } from "../base/BaseResponse.dto";
import { Type } from "class-transformer";

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
  liquidity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  blockNumber?: number;
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

  constructor(transaction: any) {
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

  constructor(data: any) {
    this.timestamp = new Date(data.timestamp).getTime();
    this.date = new Date(data.timestamp).toLocaleDateString();
    this.price = data.price || data.close;
    this.volume = data.volume || 0;
    this.high = data.high || data.price;
    this.low = data.low || data.price;
    this.open = data.open || data.price;
    this.close = data.close || data.price;
  }
}

export class ChartDataResponseDto extends BaseResponseDto {
  data: ChartDataPointDto[];
  pair: string;
  timeframe: string;
  totalCount: number;

  constructor(data: any[], pair: string, timeframe: string) {
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

  constructor(data: any) {
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

  constructor(transactions: any[], pagination: any) {
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

  constructor(price: any) {
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