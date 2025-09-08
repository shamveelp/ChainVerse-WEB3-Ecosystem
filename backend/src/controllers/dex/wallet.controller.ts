import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IWalletController } from "../../core/interfaces/controllers/dex/IWalletController";
import { IWalletService } from "../../core/interfaces/services/dex/IWalletService";
import { IDexService } from "../../core/interfaces/services/dex/IDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/CustomError";

@injectable()
export class WalletController implements IWalletController {
  constructor(
    @inject(TYPES.IWalletService) private _walletService: IWalletService,
    @inject(TYPES.IDexService) private _dexService: IDexService
  ) {}

  connectWallet = async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const wallet = await this._walletService.connectWallet(address);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Wallet connected successfully",
        data: {
          address: wallet.address,
          connectionCount: wallet.connectionCount,
          lastConnected: wallet.lastConnected,
        }
      });
    } catch (error) {
      logger.error("Error in connectWallet:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to connect wallet";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  disconnectWallet = async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      await this._walletService.disconnectWallet(address);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Wallet disconnected successfully"
      });
    } catch (error) {
      logger.error("Error in disconnectWallet:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to disconnect wallet";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getWalletInfo = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const wallet = await this._walletService.getWalletInfo(address);
      
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
      logger.error("Error in getWalletInfo:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get wallet information";
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

      const result = await this._dexService.getTransactionHistory(address, page, limit);
      
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

  updateWalletConnection = async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const wallet = await this._walletService.updateWalletConnection(address);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Wallet connection updated",
        data: wallet
      });
    } catch (error) {
      logger.error("Error in updateWalletConnection:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to update wallet connection";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}