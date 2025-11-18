import { inject, injectable } from "inversify";
import { IAdminMarketService, AdminCoinListResult } from "../../core/interfaces/services/admin/IAdminMarketService";
import { TYPES } from "../../core/types/types";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { ICoin } from "../../models/coins.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class AdminMarketService implements IAdminMarketService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

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
      logger.error("Error getting coins for admin market:", error);
      throw new CustomError(
        "Failed to get market coins",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
          "Coin not found",
          StatusCode.NOT_FOUND
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      logger.error("Error toggling coin listing:", error);
      throw new CustomError(
        "Failed to update coin listing status",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
          throw new CustomError("Failed to update existing coin", StatusCode.INTERNAL_SERVER_ERROR);
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
      logger.error("Error creating coin from external data:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to add coin to market",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}


