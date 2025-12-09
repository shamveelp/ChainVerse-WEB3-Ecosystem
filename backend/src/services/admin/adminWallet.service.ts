import { inject, injectable } from "inversify";
import { IAdminWalletService, WalletHistoryResponse, WalletStatsResponse } from "../../core/interfaces/services/admin/IAdminWallet.service";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { EtherscanService } from "../../utils/etherscan.service";
import { BlockchainService, BlockchainTransaction, ContractInteraction } from "../../utils/blockchain.service";
import { TYPES } from "../../core/types/types";
import { IWallet } from "../../models/wallet.model";
import { ITransaction } from "../../models/transactions.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class AdminWalletService implements IAdminWalletService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  private etherscanService = new EtherscanService();
  private blockchainService = new BlockchainService();

  async getAllWallets(page: number = 1, limit: number = 20): Promise<{
    wallets: IWallet[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const result = await this._dexRepository.getAllWallets(page, limit);
      const totalPages = Math.ceil(result.total / limit);

      return {
        wallets: result.wallets,
        total: result.total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("Error getting all wallets:", error);
      throw new CustomError("Failed to get wallets", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletDetails(address: string): Promise<IWallet | null> {
    try {
      const wallet = await this._dexRepository.findWalletByAddress(address);
      if (!wallet) {
        return null;
      }

      // Enrich wallet data with balance from blockchain
      try {
        const balance = await this.blockchainService.getWalletBalance(address);
        (wallet as any).balance = balance;
      } catch (balanceError) {
        logger.warn(`Could not fetch balance for wallet ${address}:`, balanceError);
        (wallet as any).balance = "0";
      }

      return wallet;
    } catch (error) {
      logger.error("Error getting wallet details:", error);
      throw new CustomError("Failed to get wallet details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletStats(): Promise<WalletStatsResponse> {
    try {
      return await this._dexRepository.getWalletStats();
    } catch (error) {
      logger.error("Error getting wallet stats:", error);
      throw new CustomError("Failed to get wallet statistics", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletTransactions(address: string, page: number = 1, limit: number = 20): Promise<{
    transactions: ITransaction[];
    total: number;
  }> {
    try {
      return await this._dexRepository.getTransactionsByWallet(address, page, limit);
    } catch (error) {
      logger.error("Error getting wallet transactions:", error);
      throw new CustomError("Failed to get wallet transactions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletBlockchainTransactions(address: string, page: number = 1, limit: number = 20): Promise<{
    transactions: BlockchainTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await this.blockchainService.getWalletTransactions(address, page, limit);
    } catch (error) {
      logger.error("Error getting wallet blockchain transactions:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get blockchain transactions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletContractInteractions(address: string): Promise<ContractInteraction[]> {
    try {
      return await this.blockchainService.getContractInteractions(address);
    } catch (error) {
      logger.error("Error getting wallet contract interactions:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get contract interactions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletHistoryFromEtherscan(address: string, page: number = 1, limit: number = 20): Promise<WalletHistoryResponse> {
    try {
      return await this.etherscanService.getWalletTransactions(address, page, limit, false);
    } catch (error) {
      logger.error("Error getting wallet history from Etherscan:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get wallet history from Etherscan", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletAppHistory(address: string, page: number = 1, limit: number = 20): Promise<WalletHistoryResponse> {
    try {
      return await this.etherscanService.getWalletTransactions(address, page, limit, true);
    } catch (error) {
      logger.error("Error getting wallet app history from Etherscan:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get wallet app history from Etherscan", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async exportWalletData(): Promise<any[]> {
    try {
      const { wallets } = await this._dexRepository.getAllWallets();

      const exportData = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const balance = await this.blockchainService.getWalletBalance(wallet.address);
            const transactionCount = await this._dexRepository.getTransactionsByWallet(wallet.address, 1, 1);
            const contractInteractions = await this.blockchainService.getContractInteractions(wallet.address);

            return {
              address: wallet.address,
              lastConnected: wallet.lastConnected,
              createdAt: wallet.createdAt,
              balance: balance,
              transactionCount: transactionCount.total,
              connectionCount: wallet.connectionCount || 0,
              contractInteractions: contractInteractions.length,
              contractInteractionDetails: contractInteractions.map((interaction: any) => ({
                contractName: interaction.contractName,
                transactionCount: interaction.transactionCount
              }))
            };
          } catch (error) {
            logger.warn(`Error processing wallet ${wallet.address} for export:`, error);
            return {
              address: wallet.address,
              lastConnected: wallet.lastConnected,
              createdAt: wallet.createdAt,
              balance: "0",
              transactionCount: 0,
              connectionCount: wallet.connectionCount || 0,
              contractInteractions: 0,
              contractInteractionDetails: []
            };
          }
        })
      );

      return exportData;
    } catch (error) {
      logger.error("Error exporting wallet data:", error);
      throw new CustomError("Failed to export wallet data", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async refreshWalletData(address: string): Promise<IWallet | null> {
    try {
      const wallet = await this._dexRepository.findWalletByAddress(address);
      if (!wallet) {
        throw new CustomError("Wallet not found", StatusCode.NOT_FOUND);
      }

      // Update last connected time
      const updatedWallet = await this._dexRepository.updateWalletConnection(address);

      // Refresh balance and transaction data in the background
      this.refreshWalletDataBackground(address);

      return updatedWallet;
    } catch (error) {
      logger.error("Error refreshing wallet data:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to refresh wallet data", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  private async refreshWalletDataBackground(address: string): Promise<void> {
    try {
      // Get latest balance and transactions without blocking the response
      await Promise.all([
        this.blockchainService.getWalletBalance(address),
        this.blockchainService.getWalletTransactions(address, 1, 10),
        this.blockchainService.getContractInteractions(address)
      ]);

      logger.info(`Background blockchain refresh completed for wallet: ${address}`);
    } catch (error) {
      logger.warn(`Background blockchain refresh failed for wallet ${address}:`, error);
    }
  }
}