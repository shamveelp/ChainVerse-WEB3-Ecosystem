import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { IDexSwapController } from "../../core/interfaces/controllers/dex/IDexSwap.controller";
import { IDexSwapService } from "../../core/interfaces/services/dex/IDexSwapService";

@injectable()
export class DexSwapController implements IDexSwapController {
    constructor(
        @inject(TYPES.IDexSwapService) private _dexSwapService: IDexSwapService
    ) { }

    async recordSwap(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const swapData = req.body;

            const result = await this._dexSwapService.recordSwapTransaction(userId, swapData);

            res.status(StatusCode.CREATED).json({
                success: true,
                data: result,
                message: SuccessMessages.SWAP_RECORDED_SUCCESS
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_RECORD_SWAP;
            logger.error(LoggerMessages.RECORD_SWAP_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateSwapStatus(req: Request, res: Response): Promise<void> {
        try {
            const { txHash } = req.params;
            const { status } = req.body;

            if (!['completed', 'failed'].includes(status)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_SWAP_STATUS
                });
                return;
            }

            const result = await this._dexSwapService.updateSwapStatus(txHash, status);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: SuccessMessages.SWAP_STATUS_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_SWAP_STATUS;
            logger.error(LoggerMessages.UPDATE_SWAP_STATUS_ERROR, { message, stack: err.stack, txHash: req.params.txHash });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getSwapHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const filters = req.query;

            const result = await this._dexSwapService.getUserSwapHistory(userId, filters as any);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_SWAP_HISTORY;
            logger.error(LoggerMessages.GET_SWAP_HISTORY_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getSwapTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { txHash } = req.params;

            const result = await this._dexSwapService.getSwapTransaction(txHash);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_SWAP_TX;
            logger.error(LoggerMessages.GET_SWAP_TX_ERROR, { message, stack: err.stack, txHash: req.params.txHash });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getChartData(req: Request, res: Response): Promise<void> {
        try {
            const chartQuery = req.query;

            const result = await this._dexSwapService.getChartData(chartQuery as any);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_CHART_DATA;
            logger.error(LoggerMessages.GET_CHART_DATA_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateTokenPrice(req: Request, res: Response): Promise<void> {
        try {
            const priceData = req.body;

            const result = await this._dexSwapService.updateTokenPrice(priceData);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: SuccessMessages.TOKEN_PRICE_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_TOKEN_PRICE;
            logger.error(LoggerMessages.UPDATE_TOKEN_PRICE_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getTokenPrice(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;

            if (!['ETH', 'CoinA', 'CoinB'].includes(token)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_TOKEN_ENUM
                });
                return;
            }

            const result = await this._dexSwapService.getTokenPrice(token);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_TOKEN_PRICE;
            logger.error(LoggerMessages.GET_TOKEN_PRICE_ERROR, { message, stack: err.stack, token: req.params.token });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getTradingPairStats(req: Request, res: Response): Promise<void> {
        try {
            const { baseToken, quoteToken } = req.params;

            if (!['ETH', 'CoinA', 'CoinB'].includes(baseToken) || !['ETH', 'CoinA', 'CoinB'].includes(quoteToken)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_TOKENS_ENUM
                });
                return;
            }

            const result = await this._dexSwapService.getTradingPairStats(baseToken as any, quoteToken as any);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_PAIR_STATS;
            logger.error(LoggerMessages.GET_PAIR_STATS_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getDEXStats(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._dexSwapService.getOverallDEXStats();

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_DEX_STATS;
            logger.error(LoggerMessages.GET_DEX_STATS_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getUserTradingStats(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;

            const result = await this._dexSwapService.getUserTradingStats(userId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_USER_TRADING_STATS;
            logger.error(LoggerMessages.GET_USER_TRADING_STATS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getTopTradingPairs(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._dexSwapService.getTopTradingPairs();

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_TOP_PAIRS;
            logger.error(LoggerMessages.GET_TOP_PAIRS_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getRecentSwaps(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await this._dexSwapService.getRecentSwaps(limit);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_RECENT_SWAPS;
            logger.error(LoggerMessages.GET_RECENT_SWAPS_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}