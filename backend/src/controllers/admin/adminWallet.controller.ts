import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminWalletController } from "../../core/interfaces/controllers/admin/IAdminWalletController";
import { IAdminWalletService } from "../../core/interfaces/services/admin/IAdminWalletService";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";

@injectable()
export class AdminWalletController implements IAdminWalletController {
  constructor(
    @inject(TYPES.IAdminWalletService) private _adminWalletService: IAdminWalletService
  ) { }

  /**
   * Retrieves all wallets with pagination.
   * @param req - Express Request object containing query parameters (page, limit).
   * @param res - Express Response object.
   */
  getAllWallets = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this._adminWalletService.getAllWallets(page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.WALLETS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_ALL_WALLETS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLETS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves details of a specific wallet by address.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletDetails = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const wallet = await this._adminWalletService.getWalletDetails(address);

      if (!wallet) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.WALLET_NOT_FOUND
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: wallet,
        message: SuccessMessages.WALLET_DETAILS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_DETAILS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLET_DETAILS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves aggregate statistics for all wallets.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  getWalletStats = async (req: Request, res: Response) => {
    try {
      const stats = await this._adminWalletService.getWalletStats();

      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: SuccessMessages.WALLET_STATS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_STATS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLET_STATS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves transactions for a specific wallet from the local database.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletTransactions = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const result = await this._adminWalletService.getWalletTransactions(address, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.WALLET_TRANSACTIONS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_TRANSACTIONS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLET_TRANSACTIONS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves blockchain transactions for a specific wallet (e.g., from Etherscan/BscScan).
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletBlockchainTransactions = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const result = await this._adminWalletService.getWalletBlockchainTransactions(address, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.BLOCKCHAIN_TRANSACTIONS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_BLOCKCHAIN_TRANSACTIONS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_BLOCKCHAIN_TRANSACTIONS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves contract interactions for a specific wallet.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletContractInteractions = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const result = await this._adminWalletService.getWalletContractInteractions(address);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.CONTRACT_INTERACTIONS_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_CONTRACT_INTERACTIONS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_CONTRACT_INTERACTIONS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves wallet history specifically from Etherscan.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletHistoryFromEtherscan = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const result = await this._adminWalletService.getWalletHistoryFromEtherscan(address, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.WALLET_ETHERSCAN_HISTORY_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_ETHERSCAN_HISTORY_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLET_ETHERSCAN_HISTORY;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves wallet history concerning app-specific interactions.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  getWalletAppHistory = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const result = await this._adminWalletService.getWalletAppHistory(address, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.WALLET_APP_HISTORY_RETRIEVED
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_WALLET_APP_HISTORY_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_WALLET_APP_HISTORY;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Exports wallet data to a file (e.g., CSV/JSON).
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  exportWalletData = async (req: Request, res: Response) => {
    try {
      const data = await this._adminWalletService.exportWalletData();

      res.status(StatusCode.OK).json({
        success: true,
        data,
        message: SuccessMessages.WALLET_DATA_EXPORTED
      });
    } catch (error) {
      logger.error(LoggerMessages.EXPORT_WALLET_DATA_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_EXPORT_WALLET_DATA;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Manually refreshes data for a specific wallet.
   * @param req - Express Request object containing wallet address in params.
   * @param res - Express Response object.
   */
  refreshWalletData = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
        return;
      }

      const wallet = await this._adminWalletService.refreshWalletData(address);

      res.status(StatusCode.OK).json({
        success: true,
        data: wallet,
        message: SuccessMessages.WALLET_DATA_REFRESHED
      });
    } catch (error) {
      logger.error(LoggerMessages.REFRESH_WALLET_DATA_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_REFRESH_WALLET_DATA;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}