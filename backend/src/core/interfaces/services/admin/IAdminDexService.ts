import { ICoin } from "../../../../models/coins.model";

export interface IAdminDexService {
  createCoin(coinData: {
    name: string;
    symbol: string;
    ticker: string;
    totalSupply: string;
    decimals?: number;
    description?: string;
    logoUrl?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    createdBy: string;
  }): Promise<ICoin>;
  
  deployCoin(contractAddress: string, deploymentTxHash: string): Promise<ICoin>;
  updateCoin(contractAddress: string, updateData: Partial<ICoin>): Promise<ICoin>;
  deleteCoin(contractAddress: string): Promise<boolean>;
  listCoin(contractAddress: string): Promise<ICoin>;
  unlistCoin(contractAddress: string): Promise<ICoin>;
  getAllCoins(includeUnlisted?: boolean): Promise<ICoin[]>;
  getCoinDetails(contractAddress: string): Promise<ICoin | null>;
  
  getDexStats(): Promise<{
    totalCoins: number;
    listedCoins: number;
    totalTransactions: number;
    totalVolume: string;
    activeWallets: number;
  }>;
  
  validateCoinData(coinData: any): { isValid: boolean; errors: string[] };
}