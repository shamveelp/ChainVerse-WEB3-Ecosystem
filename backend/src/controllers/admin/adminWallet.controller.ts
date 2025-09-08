import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminWalletController } from "../../core/interfaces/controllers/admin/IAdminWalletController";
import { IAdminWalletService } from "../../core/interfaces/services/admin/IAdminWalletService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/CustomError";

@injectable()
export class AdminWalletController implements IAdminWalletController {
  constructor(
    @inject(TYPES.IAdminWalletService) private _adminWalletService: IAdminWalletService
  ) {}

  getAllWallets = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await this._adminWalletService.getAllWallets(page, limit);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error("Error in getAllWallets:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get wallets";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getWalletDetails = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const wallet = await this._adminWalletService.getWalletDetails(address);
      
      if (!wallet) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: "Wallet not found"
        });
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: wallet
      });
    } catch (error) {
      logger.error("Error in getWalletDetails:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get wallet details";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getWalletStats = async (req: Request, res: Response) => {
    try {
      const stats = await this._adminWalletService.getWalletStats();
      
      res.status(StatusCode.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error("Error in getWalletStats:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get wallet statistics";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getWalletTransactions = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const result = await this._adminWalletService.getWalletTransactions(address, page, limit);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error("Error in getWalletTransactions:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get wallet transactions";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  exportWalletData = async (req: Request, res: Response) => {
    try {
      const data = await this._adminWalletService.exportWalletData();
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Wallet data exported successfully",
        data
      });
    } catch (error) {
      logger.error("Error in exportWalletData:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to export wallet data";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}