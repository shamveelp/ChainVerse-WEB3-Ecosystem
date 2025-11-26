import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { IAITradingController } from "../../core/interfaces/controllers/aiChat/IAITrading.controller";
import { IAITradingService } from "../../core/interfaces/services/aiChat/IAITradingService";

@injectable()
export class AITradingController implements IAITradingController {
    constructor(
        @inject(TYPES.IAITradingService) private _aiTradingService: IAITradingService
    ) {}

    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { message, sessionId, walletAddress, walletConnected, context } = req.body;
            const userId = (req as any).user?.id; // Optional user ID from auth middleware

            if (!message || !sessionId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message and sessionId are required"
                });
                return;
            }

            const response = await this._aiTradingService.processMessage(
                message,
                sessionId,
                userId,
                walletAddress,
                { ...context, walletConnected }
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: response
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to process AI message";
            logger.error("Send AI message error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async analyzeTradeOpportunity(req: Request, res: Response): Promise<void> {
        try {
            const { fromToken, toToken, amount } = req.body;
            const walletAddress = req.body.walletAddress;

            if (!fromToken || !toToken || !amount) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "fromToken, toToken, and amount are required"
                });
                return;
            }

            const analysis = await this._aiTradingService.analyzeTradeOpportunity(
                fromToken,
                toToken,
                amount,
                walletAddress
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: analysis
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to analyze trade opportunity";
            logger.error("Analyze trade error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getAvailableTokens(req: Request, res: Response): Promise<void> {
        try {
            const tokens = await this._aiTradingService.getAvailableTokens();

            res.status(StatusCode.OK).json({
                success: true,
                data: tokens
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get available tokens";
            logger.error("Get available tokens error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async calculateSwapEstimate(req: Request, res: Response): Promise<void> {
        try {
            const { fromToken, toToken, amount } = req.query;

            if (!fromToken || !toToken || !amount) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "fromToken, toToken, and amount are required"
                });
                return;
            }

            const estimate = await this._aiTradingService.calculateSwapEstimate(
                fromToken as string,
                toToken as string,
                amount as string
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: estimate
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to calculate swap estimate";
            logger.error("Calculate swap estimate error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getChatHistory(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const limit = parseInt(req.query.limit as string) || 20;

            if (!sessionId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Session ID is required"
                });
                return;
            }

            const chatHistory = await this._aiTradingService.getChatHistory(sessionId, limit);

            res.status(StatusCode.OK).json({
                success: true,
                data: chatHistory
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get chat history";
            logger.error("Get chat history error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getTokenPrices(req: Request, res: Response): Promise<void> {
        try {
            const tokens = await this._aiTradingService.getAvailableTokens();
            
            res.status(StatusCode.OK).json({
                success: true,
                data: {
                    tokens,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get token prices";
            logger.error("Get token prices error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async executeTradeWithAI(req: Request, res: Response): Promise<void> {
        try {
            const { fromToken, toToken, amount, sessionId, walletAddress, slippage } = req.body;

            if (!fromToken || !toToken || !amount || !sessionId || !walletAddress) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "All trading parameters are required"
                });
                return;
            }

            // This would integrate with your existing DEX trading logic
            // For now, return a success response with transaction simulation
            const mockTransactionHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            
            const swapEstimate = await this._aiTradingService.calculateSwapEstimate(
                fromToken,
                toToken,
                amount
            );

            const response = {
                success: true,
                transactionHash: mockTransactionHash,
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: swapEstimate.estimatedOutput,
                exchangeRate: (parseFloat(swapEstimate.estimatedOutput) / parseFloat(amount)).toFixed(6),
                gasFee: swapEstimate.gasFee,
                explorerUrl: `https://sepolia.etherscan.io/tx/${mockTransactionHash}`
            };

            // Add success message to chat history
            await this._aiTradingService.processMessage(
                `Trade executed successfully! Swapped ${amount} ${fromToken} for ${swapEstimate.estimatedOutput} ${toToken}. Transaction: ${mockTransactionHash}`,
                sessionId,
                undefined,
                walletAddress,
                { transactionHash: mockTransactionHash }
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: response
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to execute trade";
            logger.error("Execute trade with AI error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}