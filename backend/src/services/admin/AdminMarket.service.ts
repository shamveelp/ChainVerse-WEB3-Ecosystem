import { inject, injectable } from "inversify";
import { IAdminMarketService, AdminCoinListResult } from "../../core/interfaces/services/admin/IAdminMarket.service";
import { TYPES } from "../../core/types/types";
import { IDexRepository } from "../../core/interfaces/repositories/IDex.repository";
import { ICoin } from "../../models/coins.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class AdminMarketService implements IAdminMarketService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) { }

  /**
   * Retrieves coins from the market.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=10] - Items per page.
   * @param {string} [search] - Search text.
   * @param {boolean} [includeUnlisted=true] - Whether to include unlisted coins.
   * @returns {Promise<AdminCoinListResult>} List of coins.
   */
  async getCoins(
    page: number = 1,
    limit: number = 10,
    search?: string,
    includeUnlisted: boolean = true
  ): Promise<AdminCoinListResult> {
    try {
      const { coins, total } = await this._dexRepository.getCoins(
        page,
        limit,
        search,
        includeUnlisted
      );

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        coins,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error(LoggerMessages.GET_MARKET_COINS_ERROR, error);
      throw new CustomError(
        ErrorMessages.FAILED_FETCH_MARKET_COINS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Toggles the listing status of a coin.
   * @param {string} contractAddress - Coin contract address.
   * @param {boolean} isListed - New listing status.
   * @returns {Promise<ICoin>} Updated coin.
   * @throws {CustomError} If coin not found or update fails.
   */
  async toggleCoinListing(
    contractAddress: string,
    isListed: boolean
  ): Promise<ICoin> {
    try {
      const updated = await this._dexRepository.toggleCoinListing(
        contractAddress,
        isListed
      );

      if (!updated) {
        throw new CustomError(
          ErrorMessages.COIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      logger.error(LoggerMessages.UPDATE_COIN_LISTING_ERROR, error);
      throw new CustomError(
        ErrorMessages.FAILED_UPDATE_COIN_LISTING,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Creates a coin entry from external data.
   * @param {Object} data - Coin data.
   * @param {string} adminId - Admin ID.
   * @returns {Promise<ICoin>} Created or updated coin.
   */
  async createCoinFromExternal(
    data: {
      symbol: string;
      name: string;
      priceUSD?: number;
      volume24h?: string;
      marketCap?: string;
      network?: string;
    },
    adminId: string
  ): Promise<ICoin> {
    try {
      const existing = await this._dexRepository.findCoinBySymbol(data.symbol);
      if (existing) {
        // If coin already exists, just ensure it's listed
        const updated = await this._dexRepository.toggleCoinListing(
          existing.contractAddress,
          true
        );
        if (!updated) {
          throw new CustomError(ErrorMessages.FAILED_UPDATE_COIN_LISTING, StatusCode.INTERNAL_SERVER_ERROR);
        }
        return updated;
      }

      const now = new Date();
      const coin: Partial<ICoin> = {
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        ticker: data.symbol.toUpperCase(),
        // NOTE: For external coins we don't have a real contract address.
        // We store a synthetic identifier to keep it unique inside this app.
        contractAddress: `BINANCE:${data.symbol.toUpperCase()}`,
        decimals: 8,
        totalSupply: "0",
        circulatingSupply: "0",
        network: data.network || "binance",
        isListed: true,
        createdBy: adminId,
        priceUSD: data.priceUSD,
        volume24h: data.volume24h,
        marketCap: data.marketCap,
        createdAt: now,
        updatedAt: now,
      };

      return await this._dexRepository.createCoin(coin);
    } catch (error) {
      logger.error(LoggerMessages.CREATE_COIN_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_ADD_COIN_MARKET,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Deletes a coin.
   * @param {string} contractAddress - Coin contract address.
   * @returns {Promise<void>}
   * @throws {CustomError} If coin not found or deletion fails.
   */
  async deleteCoin(contractAddress: string): Promise<void> {
    try {
      const deleted = await this._dexRepository.deleteCoin(contractAddress);
      if (!deleted) {
        throw new CustomError(ErrorMessages.COIN_NOT_FOUND, StatusCode.NOT_FOUND);
      }
    } catch (error) {
      logger.error(LoggerMessages.DELETE_COIN_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_DELETE_COIN,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}


