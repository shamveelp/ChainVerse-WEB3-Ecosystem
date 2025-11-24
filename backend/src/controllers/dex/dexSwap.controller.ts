import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
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
                message: "Swap transaction recorded successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to record swap transaction";
            logger.error("Record swap error:", { message, stack: err.stack, userId: (req as any).user?.id });
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
                    error: "Invalid status. Must be 'completed' or 'failed'"
                });
                return;
            }

            const result = await this._dexSwapService.updateSwapStatus(txHash, status);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Swap status updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update swap status";
            logger.error("Update swap status error:", { message, stack: err.stack, txHash: req.params.txHash });
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
            const message = err.message || "Failed to get swap history";
            logger.error("Get swap history error:", { message, stack: err.stack, userId: (req as any).user?.id });
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
            const message = err.message || "Failed to get swap transaction";
            logger.error("Get swap transaction error:", { message, stack: err.stack, txHash: req.params.txHash });
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
            const message = err.message || "Failed to get chart data";
            logger.error("Get chart data error:", { message, stack: err.stack });
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
                message: "Token price updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update token price";
            logger.error("Update token price error:", { message, stack: err.stack });
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
                    error: "Invalid token. Must be ETH, CoinA, or CoinB"
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
            const message = err.message || "Failed to get token price";
            logger.error("Get token price error:", { message, stack: err.stack, token: req.params.token });
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
                    error: "Invalid tokens. Must be ETH, CoinA, or CoinB"
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
            const message = err.message || "Failed to get trading pair stats";
            logger.error("Get trading pair stats error:", { message, stack: err.stack });
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
            const message = err.message || "Failed to get DEX stats";
            logger.error("Get DEX stats error:", { message, stack: err.stack });
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
            const message = err.message || "Failed to get user trading stats";
            logger.error("Get user trading stats error:", { message, stack: err.stack, userId: (req as any).user?.id });
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
            const message = err.message || "Failed to get top trading pairs";
            logger.error("Get top trading pairs error:", { message, stack: err.stack });
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
            const message = err.message || "Failed to get recent swaps";
            logger.error("Get recent swaps error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}