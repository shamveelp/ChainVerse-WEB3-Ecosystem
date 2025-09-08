import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminDexController } from "../../core/interfaces/controllers/admin/IAdminDexController";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/CustomError";

@injectable()
export class AdminDexController implements IAdminDexController {
  constructor(
    @inject(TYPES.IAdminDexService) private _adminDexService: IAdminDexService
  ) {}

  createCoin = async (req: Request, res: Response) => {
    try {
      const { name, symbol, ticker, totalSupply, decimals, description, logoUrl, website, twitter, telegram } = req.body;
      const createdBy = (req as any).admin?.id; // Assuming admin middleware sets this
      
      if (!createdBy) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "Admin authentication required"
        });
      }

      const coin = await this._adminDexService.createCoin({
        name,
        symbol,
        ticker,
        totalSupply,
        decimals,
        description,
        logoUrl,
        website,
        twitter,
        telegram,
        createdBy
      });
      
      res.status(StatusCode.CREATED).json({
        success: true,
        message: "Coin created successfully",
        data: coin
      });
    } catch (error) {
      logger.error("Error in createCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to create coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  updateCoin = async (req: Request, res: Response) => {
    try {
      const { contractAddress } = req.params;
      const updateData = req.body;
      
      if (!contractAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address is required"
        });
      }

      const coin = await this._adminDexService.updateCoin(contractAddress, updateData);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin updated successfully",
        data: coin
      });
    } catch (error) {
      logger.error("Error in updateCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to update coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  deleteCoin = async (req: Request, res: Response) => {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address is required"
        });
      }

      const success = await this._adminDexService.deleteCoin(contractAddress);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin deleted successfully"
      });
    } catch (error) {
      logger.error("Error in deleteCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to delete coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  listCoin = async (req: Request, res: Response) => {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address is required"
        });
      }

      const coin = await this._adminDexService.listCoin(contractAddress);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin listed successfully",
        data: coin
      });
    } catch (error) {
      logger.error("Error in listCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to list coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  unlistCoin = async (req: Request, res: Response) => {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address is required"
        });
      }

      const coin = await this._adminDexService.unlistCoin(contractAddress);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin unlisted successfully",
        data: coin
      });
    } catch (error) {
      logger.error("Error in unlistCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to unlist coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getAllCoins = async (req: Request, res: Response) => {
    try {
      const includeUnlisted = req.query.includeUnlisted === 'true';
      const coins = await this._adminDexService.getAllCoins(includeUnlisted);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: coins
      });
    } catch (error) {
      logger.error("Error in getAllCoins:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get coins";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getCoinDetails = async (req: Request, res: Response) => {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address is required"
        });
      }

      const coin = await this._adminDexService.getCoinDetails(contractAddress);
      
      if (!coin) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: "Coin not found"
        });
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: coin
      });
    } catch (error) {
      logger.error("Error in getCoinDetails:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get coin details";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  deployCoin = async (req: Request, res: Response) => {
    try {
      const { contractAddress, deploymentTxHash } = req.body;
      
      if (!contractAddress || !deploymentTxHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Contract address and deployment transaction hash are required"
        });
      }

      const coin = await this._adminDexService.deployCoin(contractAddress, deploymentTxHash);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Coin deployed successfully",
        data: coin
      });
    } catch (error) {
      logger.error("Error in deployCoin:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to deploy coin";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getDexStats = async (req: Request, res: Response) => {
    try {
      const stats = await this._adminDexService.getDexStats();
      
      res.status(StatusCode.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error("Error in getDexStats:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get DEX statistics";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}