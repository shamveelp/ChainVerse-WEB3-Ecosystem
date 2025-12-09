import { IWallet } from "../../../models/wallet.model";
import { ITransaction } from "../../../models/transactions.model";
import { ICoin } from "../../../models/coins.model";

export interface IDexRepository {
  // Wallet operations
  createWallet(walletData: Partial<IWallet>): Promise<IWallet>;
  findWalletByAddress(address: string): Promise<IWallet | null>;
  updateWalletConnection(address: string): Promise<IWallet | null>;
  getAllWallets(page?: number, limit?: number): Promise<{ wallets: IWallet[], total: number }>;
  getWalletStats(): Promise<{
    totalWallets: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  }>;

  // Transaction operations
  createTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction>;
  findTransactionByHash(hash: string): Promise<ITransaction | null>;
  updateTransactionStatus(hash: string, status: 'completed' | 'failed', additionalData?: any): Promise<ITransaction | null>;
  getTransactionsByWallet(walletAddress: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }>;
  getAllTransactions(page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }>;
  getTransactionStats(): Promise<{
    totalTransactions: number;
    todayVolume: string;
    weeklyVolume: string;
    monthlyVolume: string;
  }>;

  // Coin operations
  createCoin(coinData: Partial<ICoin>): Promise<ICoin>;
  findCoinByAddress(contractAddress: string): Promise<ICoin | null>;
  findCoinBySymbol(symbol: string): Promise<ICoin | null>;
  updateCoin(contractAddress: string, updateData: Partial<ICoin>): Promise<ICoin | null>;
  getCoins(
    page: number,
    limit: number,
    search?: string,
    includeUnlisted?: boolean
  ): Promise<{ coins: ICoin[]; total: number }>;
  getAllCoins(includeUnlisted?: boolean): Promise<ICoin[]>;
  getListedCoins(): Promise<ICoin[]>;
  toggleCoinListing(contractAddress: string, isListed: boolean): Promise<ICoin | null>;
  deleteCoin(contractAddress: string): Promise<boolean>;
}