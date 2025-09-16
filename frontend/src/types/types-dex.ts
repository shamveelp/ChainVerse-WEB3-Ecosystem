export interface TokenBalance {
  eth: string;
  coinA: string;
  coinB: string;
}

export interface PoolData {
  ethReserve: string;
  tokenReserve: string;
  totalLiquidity: string;
  userLiquidity: string;
}

export interface SwapForm {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
}

export interface LiquidityForm {
  poolType: string;
  ethAmount: string;
  tokenAmount: string;
  coinAAmount: string;
  coinBAmount: string;
}