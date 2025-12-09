import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IDexController } from "../../core/interfaces/controllers/dex/IDexController";
import { IDexService } from "../../core/interfaces/services/dex/IDex.service";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class DexController implements IDexController {
  constructor(
    @inject(TYPES.IDexService) private _dexService: IDexService
  ) { }

  /**
   * Executes a token swap.
   * @param req - Express Request object containing swap details.
   * @param res - Express Response object.
   */
  executeSwap = async (req: Request, res: Response) => {
    try {
      const { walletAddress, fromToken, toToken, fromAmount, toAmount, transactionHash, network } = req.body;

      if (!walletAddress || !fromToken || !toToken || !fromAmount || !toAmount || !transactionHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MISSING_SWAP_PARAMS
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
        message: SuccessMessages.SWAP_TRANSACTION_RECORDED,
        data: transaction
      });
    } catch (error) {
      logger.error(LoggerMessages.EXECUTE_SWAP_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_EXECUTE_SWAP;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves a quote for a token swap.
   * @param req - Express Request object containing fromToken, toToken, and amount in query.
   * @param res - Express Response object.
   */
  getSwapQuote = async (req: Request, res: Response) => {
    try {
      const { fromToken, toToken, amount } = req.query;

      if (!fromToken || !toToken || !amount) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MISSING_QUOTE_PARAMS
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
      logger.error(LoggerMessages.GET_SWAP_QUOTE_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_SWAP_QUOTE;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves transaction history for a wallet.
   * @param req - Express Request object containing walletAddress in params and pagination in query.
   * @param res - Express Response object.
   */
  getTransactionHistory = async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!walletAddress) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.WALLET_ADDRESS_REQUIRED
        });
      }

      const result = await this._dexService.getTransactionHistory(walletAddress, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_TX_HISTORY_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_TX_HISTORY;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves details of a specific transaction.
   * @param req - Express Request object containing transaction hash in params.
   * @param res - Express Response object.
   */
  getTransactionDetails = async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;

      if (!hash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.TX_HASH_REQUIRED
        });
      }

      const transaction = await this._dexService.getTransactionDetails(hash);

      if (!transaction) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.TX_NOT_FOUND
        });
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_TX_DETAILS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_TX_DETAILS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves available trading pairs.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  getAvailablePairs = async (req: Request, res: Response) => {
    try {
      const pairs = await this._dexService.getAvailablePairs();

      res.status(StatusCode.OK).json({
        success: true,
        data: pairs
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_AVAILABLE_PAIRS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_PAIRS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Updates the status of a transaction.
   * @param req - Express Request object containing hash in params and status/details in body.
   * @param res - Express Response object.
   */
  updateTransactionStatus = async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const { status, gasUsed, gasPrice, blockNumber } = req.body;

      if (!hash || !status) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.TX_HASH_STATUS_REQUIRED
        });
      }

      const transaction = await this._dexService.updateTransactionStatus(hash, status, {
        gasUsed,
        gasPrice,
        blockNumber
      });

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.TX_STATUS_UPDATED,
        data: transaction
      });
    } catch (error) {
      logger.error(LoggerMessages.UPDATE_TX_STATUS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_UPDATE_TX_STATUS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}