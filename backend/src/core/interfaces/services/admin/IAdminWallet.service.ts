import { IWallet } from "../../../../models/wallet.model";
import { ITransaction } from "../../../../models/transactions.model";
import { BlockchainTransaction, ContractInteraction } from "../../../../utils/blockchain.service";

export interface EtherscanTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  input: string;
  contractAddress: string;
  functionName?: string;
  methodId?: string;
}

export interface WalletHistoryResponse {
  transactions: EtherscanTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletStatsResponse {
  totalWallets: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
}

export interface IAdminWalletService {
  getAllWallets(page?: number, limit?: number): Promise<{ wallets: IWallet[], total: number, page: number, limit: number, totalPages: number }>;
  getWalletDetails(address: string): Promise<IWallet | null>;
  getWalletStats(): Promise<WalletStatsResponse>;
  getWalletTransactions(address: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }>;
  getWalletBlockchainTransactions(address: string, page?: number, limit?: number): Promise<{
    transactions: BlockchainTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getWalletContractInteractions(address: string): Promise<ContractInteraction[]>;
  getWalletHistoryFromEtherscan(address: string, page?: number, limit?: number): Promise<WalletHistoryResponse>;
  getWalletAppHistory(address: string, page?: number, limit?: number): Promise<WalletHistoryResponse>;
  exportWalletData(): Promise<Record<string, unknown>[]>;
  refreshWalletData(address: string): Promise<IWallet | null>;
}