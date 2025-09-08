import { IWallet } from "../../../../models/wallet.model";
import { ITransaction } from "../../../../models/transactions.model";

export interface IAdminWalletService {
  getAllWallets(page?: number, limit?: number): Promise<{ wallets: IWallet[], total: number }>;
  getWalletDetails(address: string): Promise<IWallet | null>;
  getWalletStats(): Promise<{
    totalWallets: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  }>;
  getWalletTransactions(address: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }>;
  exportWalletData(): Promise<any[]>;
}