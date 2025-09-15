import { inject, injectable } from "inversify";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDexService";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { TYPES } from "../../core/types/types";
import { ICoin } from "../../models/coins.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class AdminDexService implements IAdminDexService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  async createCoin(coinData: {
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
  }): Promise<ICoin> {
    try {
      const validation = this.validateCoinData(coinData);
      if (!validation.isValid) {
        throw new CustomError(`Validation failed: ${validation.errors.join(', ')}`, StatusCode.BAD_REQUEST);
      }

      // Check if coin already exists
      const existingCoin = await this._dexRepository.findCoinBySymbol(coinData.symbol);
      if (existingCoin) {
        throw new CustomError("Coin with this symbol already exists", StatusCode.BAD_REQUEST);
      }

      const coin = await this._dexRepository.createCoin({
        ...coinData,
        circulatingSupply: coinData.totalSupply, // Initially same as total supply
        network: 'sepolia',
        isListed: false, // Not listed until deployed
      });

      logger.info(`Coin created: ${coin.symbol} (${coin.name})`);
      return coin;
    } catch (error) {
      logger.error("Error creating coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to create coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deployCoin(contractAddress: string, deploymentTxHash: string): Promise<ICoin> {
    try {
      // Check if contract address is already used
      const existingCoin = await this._dexRepository.findCoinByAddress(contractAddress);
      if (existingCoin) {
        throw new CustomError("Contract address already in use", StatusCode.BAD_REQUEST);
      }

      // This should be called after successful deployment
      const coin = await this._dexRepository.updateCoin(contractAddress, {
        deploymentTxHash,
        isListed: true,
      });

      if (!coin) {
        throw new CustomError("Coin not found", StatusCode.NOT_FOUND);
      }

      logger.info(`Coin deployed: ${coin.symbol} at ${contractAddress}`);
      return coin;
    } catch (error) {
      logger.error("Error deploying coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to deploy coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCoin(contractAddress: string, updateData: Partial<ICoin>): Promise<ICoin> {
    try {
      const coin = await this._dexRepository.updateCoin(contractAddress, updateData);
      if (!coin) {
        throw new CustomError("Coin not found", StatusCode.NOT_FOUND);
      }

      logger.info(`Coin updated: ${contractAddress}`);
      return coin;
    } catch (error) {
      logger.error("Error updating coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to update coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteCoin(contractAddress: string): Promise<boolean> {
    try {
      const success = await this._dexRepository.deleteCoin(contractAddress);
      if (!success) {
        throw new CustomError("Coin not found or could not be deleted", StatusCode.NOT_FOUND);
      }

      logger.info(`Coin deleted: ${contractAddress}`);
      return success;
    } catch (error) {
      logger.error("Error deleting coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to delete coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async listCoin(contractAddress: string): Promise<ICoin> {
    try {
      const coin = await this._dexRepository.toggleCoinListing(contractAddress, true);
      if (!coin) {
        throw new CustomError("Coin not found", StatusCode.NOT_FOUND);
      }

      logger.info(`Coin listed: ${coin.symbol}`);
      return coin;
    } catch (error) {
      logger.error("Error listing coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to list coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async unlistCoin(contractAddress: string): Promise<ICoin> {
    try {
      const coin = await this._dexRepository.toggleCoinListing(contractAddress, false);
      if (!coin) {
        throw new CustomError("Coin not found", StatusCode.NOT_FOUND);
      }

      logger.info(`Coin unlisted: ${coin.symbol}`);
      return coin;
    } catch (error) {
      logger.error("Error unlisting coin:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to unlist coin", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllCoins(includeUnlisted: boolean = false): Promise<ICoin[]> {
    try {
      return await this._dexRepository.getAllCoins(includeUnlisted);
    } catch (error) {
      logger.error("Error getting all coins:", error);
      throw new CustomError("Failed to get coins", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCoinDetails(contractAddress: string): Promise<ICoin | null> {
    try {
      return await this._dexRepository.findCoinByAddress(contractAddress);
    } catch (error) {
      logger.error("Error getting coin details:", error);
      throw new CustomError("Failed to get coin details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getDexStats(): Promise<{
    totalCoins: number;
    listedCoins: number;
    totalTransactions: number;
    totalVolume: string;
    activeWallets: number;
  }> {
    try {
      const [coins, walletStats, transactionStats] = await Promise.all([
        this._dexRepository.getAllCoins(true),
        this._dexRepository.getWalletStats(),
        this._dexRepository.getTransactionStats()
      ]);

      const listedCoins = coins.filter(coin => coin.isListed);

      return {
        totalCoins: coins.length,
        listedCoins: listedCoins.length,
        totalTransactions: transactionStats.totalTransactions,
        totalVolume: transactionStats.monthlyVolume,
        activeWallets: walletStats.activeThisMonth,
      };
    } catch (error) {
      logger.error("Error getting DEX stats:", error);
      throw new CustomError("Failed to get DEX statistics", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  validateCoinData(coinData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!coinData.name || coinData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    if (!coinData.symbol || coinData.symbol.trim().length < 2) {
      errors.push("Symbol must be at least 2 characters long");
    }

    if (!coinData.ticker || coinData.ticker.trim().length < 2) {
      errors.push("Ticker must be at least 2 characters long");
    }

    if (!coinData.totalSupply || parseFloat(coinData.totalSupply) <= 0) {
      errors.push("Total supply must be greater than zero");
    }

    if (coinData.decimals && (coinData.decimals < 0 || coinData.decimals > 18)) {
      errors.push("Decimals must be between 0 and 18");
    }

    if (!coinData.createdBy) {
      errors.push("Created by admin ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}