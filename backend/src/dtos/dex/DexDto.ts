export class CreateCoinDto {
  name?: string;
  symbol?: string;
  ticker?: string;
  totalSupply?: string;
  decimals?: number;
  description?: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export class SwapDto {
  walletAddress?: string;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  transactionHash?: string;
  network?: string;
}

export class WalletConnectionDto {
  address?: string;
}

export class UpdateTransactionStatusDto {
  status?: 'completed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}

export class CoinResponseDto<T = unknown> {
  success: boolean;
  message: string;
  data?: T;

  constructor(data: T, message: string = "Success") {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class TransactionResponseDto<T = unknown> {
  success: boolean;
  message: string;
  data?: T;

  constructor(data: T, message: string = "Success") {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class WalletResponseDto<T = unknown> {
  success: boolean;
  message: string;
  data?: T;

  constructor(data: T, message: string = "Success") {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}