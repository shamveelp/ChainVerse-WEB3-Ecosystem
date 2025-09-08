import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IDexController } from "../../core/interfaces/controllers/dex/IDexController";
import { IDexService } from "../../core/interfaces/services/dex/IDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/CustomError";

@injectable()
export class DexController implements IDexController {
  constructor(
    @inject(TYPES.IDexService) private _dexService: IDexService
  ) {}

  executeSwap = async (req: Request, res: Response) => {
    try {
      const { walletAddress, fromToken, toToken, fromAmount, toAmount, transactionHash, network } = req.body;
      
      if (!walletAddress || !fromToken || !toToken || !fromAmount || !toAmount || !transactionHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Missing required swap parameters"
        });
      }

      const transaction = await this._dexService.executeSwap({
        walletAddress,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        transactionHash,
        network
      });
      
      res.status(StatusCode.CREATED).json({
        success: true,
        message: "Swap transaction recorded",
        data: transaction
      });
    } catch (error) {
      logger.error("Error in executeSwap:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to execute swap";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getSwapQuote = async (req: Request, res: Response) => {
    try {
      const { fromToken, toToken, amount } = req.query;
      
      if (!fromToken || !toToken || !amount) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Missing required parameters: fromToken, toToken, amount"
        });
      }

      const quote = await this._dexService.getSwapQuote(
        fromToken as string,
        toToken as string,
        amount as string
      );
      
      res.status(StatusCode.OK).json({
        success: true,
        data: quote
      });
    } catch (error) {
      logger.error("Error in getSwapQuote:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get swap quote";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getTransactionHistory = async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!walletAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const result = await this._dexService.getTransactionHistory(walletAddress, page, limit);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error("Error in getTransactionHistory:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get transaction history";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getTransactionDetails = async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Transaction hash is required"
        });
      }

      const transaction = await this._dexService.getTransactionDetails(hash);
      
      if (!transaction) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: "Transaction not found"
        });
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error("Error in getTransactionDetails:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get transaction details";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  getAvailablePairs = async (req: Request, res: Response) => {
    try {
      const pairs = await this._dexService.getAvailablePairs();
      
      res.status(StatusCode.OK).json({
        success: true,
        data: pairs
      });
    } catch (error) {
      logger.error("Error in getAvailablePairs:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get available pairs";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  updateTransactionStatus = async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const { status, gasUsed, gasPrice, blockNumber } = req.body;
      
      if (!hash || !status) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Transaction hash and status are required"
        });
      }

      const transaction = await this._dexService.updateTransactionStatus(hash, status, {
        gasUsed,
        gasPrice,
        blockNumber
      });
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Transaction status updated",
        data: transaction
      });
    } catch (error) {
      logger.error("Error in updateTransactionStatus:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to update transaction status";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}