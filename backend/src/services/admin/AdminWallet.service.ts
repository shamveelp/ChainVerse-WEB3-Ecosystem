import { inject, injectable } from "inversify";
import { IAdminWalletService, WalletHistoryResponse, WalletStatsResponse } from "../../core/interfaces/services/admin/IAdminWallet.service";
import { IDexRepository } from "../../core/interfaces/repositories/IDex.repository";
import { EtherscanService } from "../../utils/etherscan.service";
import { BlockchainService, BlockchainTransaction, ContractInteraction } from "../../utils/blockchain.service";
import { TYPES } from "../../core/types/types";
import { IWallet } from "../../models/wallet.model";
import { ITransaction } from "../../models/transactions.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class AdminWalletService implements IAdminWalletService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) { }

  private etherscanService = new EtherscanService();
  private blockchainService = new BlockchainService();

  /**
   * 
   */
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
      logger.error(LoggerMessages.GET_ALL_WALLETS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_WALLETS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves wallet details by address.
   * @param {string} address - Wallet address.
   * @returns {Promise<IWallet | null>} Wallet details.
   */
  async getWalletDetails(address: string): Promise<IWallet | null> {
    try {
      const wallet = await this._dexRepository.findWalletByAddress(address);
      if (!wallet) {
        return null;
      }

      // Enrich wallet data with balance from blockchain
      try {
        const balance = await this.blockchainService.getWalletBalance(address);
        Object.assign(wallet, { balance });
      } catch (balanceError) {
        logger.warn(`Could not fetch balance for wallet ${address}:`, balanceError);
        Object.assign(wallet, { balance: "0" });
      }

      return wallet;
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_DETAILS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_WALLET_DETAILS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves wallet statistics.
   * @returns {Promise<WalletStatsResponse>} Wallet stats.
   */
  async getWalletStats(): Promise<WalletStatsResponse> {
    try {
      return await this._dexRepository.getWalletStats();
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_STATS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_WALLET_STATS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @param address 
   * @param page 
   * @param limit 
   * @returns 
   */
  async getWalletTransactions(address: string, page: number = 1, limit: number = 20): Promise<{
    transactions: ITransaction[];
    total: number;
  }> {
    try {
      return await this._dexRepository.getTransactionsByWallet(address, page, limit);
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_TRANSACTIONS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_WALLET_TRANSACTIONS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @param address 
   * @param page 
   * @param limit 
   * @returns 
   */
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
      logger.error(LoggerMessages.GET_WALLET_BLOCKCHAIN_TRANSACTIONS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(ErrorMessages.FAILED_GET_BLOCKCHAIN_TRANSACTIONS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves contract interactions for a wallet.
   * @param {string} address - Wallet address.
   * @returns {Promise<ContractInteraction[]>} List of interactions.
   */
  async getWalletContractInteractions(address: string): Promise<ContractInteraction[]> {
    try {
      return await this.blockchainService.getContractInteractions(address);
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_CONTRACT_INTERACTIONS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(ErrorMessages.FAILED_GET_CONTRACT_INTERACTIONS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves wallet history from Etherscan.
   * @param {string} address - Wallet address.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=20] - Items per page.
   * @returns {Promise<WalletHistoryResponse>} Etherscan history.
   */
  async getWalletHistoryFromEtherscan(address: string, page: number = 1, limit: number = 20): Promise<WalletHistoryResponse> {
    try {
      return await this.etherscanService.getWalletTransactions(address, page, limit, false);
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_ETHERSCAN_HISTORY_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(ErrorMessages.FAILED_GET_WALLET_ETHERSCAN_HISTORY, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves wallet app history.
   * @param {string} address - Wallet address.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=20] - Items per page.
   * @returns {Promise<WalletHistoryResponse>} App history.
   */
  async getWalletAppHistory(address: string, page: number = 1, limit: number = 20): Promise<WalletHistoryResponse> {
    try {
      return await this.etherscanService.getWalletTransactions(address, page, limit, true);
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_APP_HISTORY_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(ErrorMessages.FAILED_GET_WALLET_APP_HISTORY, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @returns 
   */
  async exportWalletData(): Promise<Array<{
    address: string;
    lastConnected: Date;
    createdAt: Date;
    balance: string;
    transactionCount: number;
    connectionCount: number;
    contractInteractions: number;
    contractInteractionDetails: Array<{ contractName: string; transactionCount: number }>;
  }>> {
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
              contractInteractionDetails: contractInteractions.map((interaction) => ({
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
      logger.error(LoggerMessages.EXPORT_WALLET_DATA_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_EXPORT_WALLET_DATA, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refreshes wallet data.
   * @param {string} address - Wallet address.
   * @returns {Promise<IWallet | null>} Updated wallet.
   * @throws {CustomError} If wallet not found or refresh fails.
   */
  async refreshWalletData(address: string): Promise<IWallet | null> {
    try {
      const wallet = await this._dexRepository.findWalletByAddress(address);
      if (!wallet) {
        throw new CustomError(ErrorMessages.WALLET_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Update last connected time
      const updatedWallet = await this._dexRepository.updateWalletConnection(address);

      // Refresh balance and transaction data in the background
      this.refreshWalletDataBackground(address);

      return updatedWallet;
    } catch (error) {
      logger.error(LoggerMessages.REFRESH_WALLET_DATA_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(ErrorMessages.FAILED_REFRESH_WALLET_DATA, StatusCode.INTERNAL_SERVER_ERROR);
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