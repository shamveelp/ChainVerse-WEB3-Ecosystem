import { inject, injectable } from "inversify";
import { IAdminWalletService } from "../../core/interfaces/services/admin/IAdminWalletService";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { TYPES } from "../../core/types/types";
import { IWallet } from "../../models/wallet.model";
import { ITransaction } from "../../models/transactions.model";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class AdminWalletService implements IAdminWalletService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  async getAllWallets(page?: number, limit?: number): Promise<{ wallets: IWallet[], total: number }> {
    try {
      return await this._dexRepository.getAllWallets(page, limit);
    } catch (error) {
      logger.error("Error getting all wallets:", error);
      throw new CustomError("Failed to get wallets", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletDetails(address: string): Promise<IWallet | null> {
    try {
      return await this._dexRepository.findWalletByAddress(address);
    } catch (error) {
      logger.error("Error getting wallet details:", error);
      throw new CustomError("Failed to get wallet details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletStats(): Promise<{
    totalWallets: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  }> {
    try {
      return await this._dexRepository.getWalletStats();
    } catch (error) {
      logger.error("Error getting wallet stats:", error);
      throw new CustomError("Failed to get wallet statistics", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletTransactions(address: string, page?: number, limit?: number): Promise<{ transactions: ITransaction[], total: number }> {
    try {
      return await this._dexRepository.getTransactionsByWallet(address, page, limit);
    } catch (error) {
      logger.error("Error getting wallet transactions:", error);
      throw new CustomError("Failed to get wallet transactions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async exportWalletData(): Promise<any[]> {
    try {
      const { wallets } = await this._dexRepository.getAllWallets(1, 10000); // Get all wallets
      
      return wallets.map(wallet => ({
        address: wallet.address,
        lastConnected: wallet.lastConnected,
        connectionCount: wallet.connectionCount,
        createdAt: wallet.createdAt,
      }));
    } catch (error) {
      logger.error("Error exporting wallet data:", error);
      throw new CustomError("Failed to export wallet data", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}