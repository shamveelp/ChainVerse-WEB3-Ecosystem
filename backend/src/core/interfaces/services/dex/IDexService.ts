import { ITransaction } from "../../../../models/transactions.model";
import { ICoin } from "../../../../models/coins.model";

export interface IDexService {
  executeSwap(swapData: {
    walletAddress: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    transactionHash: string;
    network?: string;
  }): Promise<ITransaction>;
  
  getSwapQuote(fromToken: string, toToken: string, amount: string): Promise<{
    toAmount: string;
    priceImpact: number;
    slippage: number;
  }>;
  
  getTransactionHistory(walletAddress: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }>;
  getTransactionDetails(hash: string): Promise<ITransaction | null>;
  getAvailablePairs(): Promise<Array<{ token0: ICoin, token1: ICoin }>>;
  updateTransactionStatus(hash: string, status: 'completed' | 'failed', additionalData?: any): Promise<ITransaction>;
  validateSwapParameters(fromToken: string, toToken: string, amount: string): Promise<boolean>;
}