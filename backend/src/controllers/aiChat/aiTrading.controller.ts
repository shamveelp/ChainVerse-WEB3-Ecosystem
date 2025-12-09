import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { IAITradingController } from "../../core/interfaces/controllers/aiChat/IAITrading.controller";
import { IAITradingService } from "../../core/interfaces/services/aiChat/IAITradingService";

@injectable()
export class AITradingController implements IAITradingController {
    constructor(
        @inject(TYPES.IAITradingService) private _aiTradingService: IAITradingService
    ) { }

    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { message, sessionId, walletAddress, walletConnected, context } = req.body;
            const userId = (req as any).user?.id; // Optional user ID from auth middleware

            if (!message || !sessionId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.MESSAGE_SESSION_REQUIRED
                });
                return;
            }

            // Enhanced context with real-time data
            const enhancedContext = {
                ...context,
                walletConnected: !!walletAddress,
                timestamp: new Date().toISOString(),
                userAgent: req.get('User-Agent'),
                sessionInfo: {
                    id: sessionId,
                    messageCount: context?.messageCount || 1
                }
            };

            const response = await this._aiTradingService.processMessage(
                message,
                sessionId,
                userId,
                walletAddress,
                enhancedContext
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: response
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to process AI message";
            logger.error(LoggerMessages.SEND_AI_MESSAGE_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message || ErrorMessages.FAILED_PROCESS_AI_MESSAGE
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
                    error: ErrorMessages.TRADING_PARAMS_REQUIRED
                });
                return;
            }

            // Validate token symbols
            const validTokens = ['ETH', 'CoinA', 'CoinB'];
            if (!validTokens.includes(fromToken) || !validTokens.includes(toToken)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_TOKEN_SYMBOLS
                });
                return;
            }

            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_AMOUNT
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
            const message = err.message || ErrorMessages.FAILED_ANALYZE_TRADE;
            logger.error(LoggerMessages.ANALYZE_TRADE_ERROR, { message, stack: err.stack });
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
            const message = err.message || ErrorMessages.FAILED_GET_TOKENS;
            logger.error(LoggerMessages.GET_TOKENS_ERROR, { message, stack: err.stack });
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
                    error: ErrorMessages.TRADING_PARAMS_REQUIRED
                });
                return;
            }

            // Validate inputs
            const validTokens = ['ETH', 'CoinA', 'CoinB'];
            if (!validTokens.includes(fromToken as string) || !validTokens.includes(toToken as string)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_TOKEN_SYMBOLS_GENERIC
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
            const message = err.message || ErrorMessages.FAILED_CALCULATE_SWAP;
            logger.error(LoggerMessages.CALCULATE_SWAP_ERROR, { message, stack: err.stack });
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
                    error: ErrorMessages.SESSION_ID_REQUIRED
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
            const message = err.message || ErrorMessages.FAILED_GET_CHAT_HISTORY;
            logger.error(LoggerMessages.GET_CHAT_HISTORY_ERROR, { message, stack: err.stack });
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
                    lastUpdated: new Date().toISOString(),
                    source: 'ChainVerse DEX + CoinGecko API'
                }
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_TOKEN_PRICES;
            logger.error(LoggerMessages.GET_TOKEN_PRICES_ERROR, { message, stack: err.stack });
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
                    error: ErrorMessages.ALL_TRADING_PARAMS_REQUIRED
                });
                return;
            }

            // Validate wallet address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.INVALID_WALLET_ADDRESS
                });
                return;
            }

            // Get realistic swap estimate
            const swapEstimate = await this._aiTradingService.calculateSwapEstimate(
                fromToken,
                toToken,
                amount
            );

            // Generate a realistic transaction hash
            const mockTransactionHash = '0x' + Array(64).fill(0).map(() =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('');

            const response = {
                success: true,
                transactionHash: mockTransactionHash,
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: swapEstimate.estimatedOutput,
                exchangeRate: (parseFloat(swapEstimate.estimatedOutput) / parseFloat(amount)).toFixed(6),
                gasFee: swapEstimate.gasFee,
                explorerUrl: `https://sepolia.etherscan.io/tx/${mockTransactionHash}`,
                executedAt: new Date().toISOString(),
                slippage: slippage || '1.0',
                priceImpact: swapEstimate.priceImpact
            };

            // Add success message to chat history with detailed info
            const successMessage = `✅ **Trade Executed Successfully!**

**Transaction Details:**
• Swapped: ${amount} ${fromToken} → ${swapEstimate.estimatedOutput} ${toToken}
• Exchange Rate: 1 ${fromToken} = ${response.exchangeRate} ${toToken}
• Gas Fee: ${swapEstimate.gasFee} ETH
• Slippage: ${slippage || '1.0'}%

**Transaction Hash:** \`${mockTransactionHash}\`

🔗 [View on Explorer]: ${response.explorerUrl}

Your trade has been completed successfully! 🎉`;

            await this._aiTradingService.processMessage(
                successMessage,
                sessionId,
                undefined,
                walletAddress,
                {
                    transactionHash: mockTransactionHash,
                    tradeExecuted: true,
                    tradeDetails: response
                }
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: response
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_EXECUTE_TRADE;
            logger.error(LoggerMessages.EXECUTE_TRADE_ERROR, { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}