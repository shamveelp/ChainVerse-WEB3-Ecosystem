import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminMarketController } from "../../core/interfaces/controllers/admin/IAdminMarketController";
import { IAdminMarketService } from "../../core/interfaces/services/admin/IAdminMarketService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";

@injectable()
export class AdminMarketController implements IAdminMarketController {
  constructor(
    @inject(TYPES.IAdminMarketService)
    private _adminMarketService: IAdminMarketService
  ) {}

  async getCoins(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, includeUnlisted } = req.query as any;

      const result = await this._adminMarketService.getCoins(
        parseInt(page),
        parseInt(limit),
        search,
        includeUnlisted === "true"
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Market coins fetched successfully",
        ...result,
      });
    } catch (error) {
      logger.error("Error getting market coins:", error);
      const err = error as any;
      const statusCode =
        err instanceof CustomError ? err.statusCode : StatusCode.BAD_REQUEST;
      const message =
        err instanceof CustomError
          ? err.message
          : "Failed to fetch market coins";

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async toggleCoinListing(req: Request, res: Response): Promise<void> {
    try {
      const { contractAddress } = req.params;
      const { isListed } = req.body as { isListed?: boolean };

      if (typeof isListed !== "boolean") {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "isListed (boolean) is required",
        });
        return;
      }

      const updated = await this._adminMarketService.toggleCoinListing(
        contractAddress,
        isListed
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: `Coin ${isListed ? "listed" : "unlisted"} successfully`,
        coin: updated,
      });
    } catch (error) {
      logger.error("Error updating coin listing:", error);
      const err = error as any;
      const statusCode =
        err instanceof CustomError ? err.statusCode : StatusCode.BAD_REQUEST;
      const message =
        err instanceof CustomError
          ? err.message
          : "Failed to update coin listing";

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async createCoinFromExternal(req: Request, res: Response): Promise<void> {
    try {
      const { symbol, name, priceUSD, volume24h, marketCap, network } = req.body as {
        symbol?: string;
        name?: string;
        priceUSD?: number;
        volume24h?: string;
        marketCap?: string;
        network?: string;
      };

      if (!symbol || !name) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "symbol and name are required",
        });
        return;
      }

      const adminId = (req as any).user?.id;

      const coin = await this._adminMarketService.createCoinFromExternal(
        { symbol, name, priceUSD, volume24h, marketCap, network },
        adminId
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin added to market successfully",
        coin,
      });
    } catch (error) {
      logger.error("Error creating coin from external data:", error);
      const err = error as any;
      const statusCode =
        err instanceof CustomError ? err.statusCode : StatusCode.BAD_REQUEST;
      const message =
        err instanceof CustomError
          ? err.message
          : "Failed to add coin to market";

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async deleteCoin(req: Request, res: Response): Promise<void> {
    try {
      const { contractAddress } = req.params;
      await this._adminMarketService.deleteCoin(contractAddress);

      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting coin:", error);
      const err = error as any;
      const statusCode =
        err instanceof CustomError ? err.statusCode : StatusCode.BAD_REQUEST;
      const message =
        err instanceof CustomError ? err.message : "Failed to delete coin";

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}


