import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IDexSwapService } from "../../core/interfaces/services/dex/IDexSwap.service";
import { IDexSwapRepository } from "../../core/interfaces/repositories/dex/IDexSwapRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import {
    RecordSwapDto,
    GetSwapHistoryDto,
    GetChartDataDto,
    UpdatePriceDto,
    SwapTransactionResponseDto,
    ChartDataResponseDto,
    SwapHistoryResponseDto,
    TradingStatsDto,
    TokenPriceResponseDto
} from "../../dtos/dex/DexSwap.dto";

@injectable()
export class DexSwapService implements IDexSwapService {
    constructor(
        @inject(TYPES.IDexSwapRepository) private _dexSwapRepository: IDexSwapRepository,
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
    ) { }

    async recordSwapTransaction(userId: string, swapData: RecordSwapDto): Promise<SwapTransactionResponseDto> {
        try {
            // Verify user exists
            const user = await this._userRepository.findById(userId);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            // Check if transaction already exists
            const existingTx = await this._dexSwapRepository.getSwapTransactionByHash(swapData.txHash);
            if (existingTx) {
                throw new CustomError("Transaction already recorded", StatusCode.CONFLICT);
            }

            // Create swap transaction
            const transaction = await this._dexSwapRepository.createSwapTransaction({
                userId: userId as any,
                walletAddress: swapData.walletAddress,
                txHash: swapData.txHash,
                fromToken: swapData.fromToken,
                toToken: swapData.toToken,
                fromAmount: swapData.fromAmount,
                toAmount: swapData.toAmount,
                actualFromAmount: swapData.actualFromAmount,
                actualToAmount: swapData.actualToAmount,
                exchangeRate: swapData.exchangeRate,
                slippage: swapData.slippage,
                gasUsed: swapData.gasUsed,
                gasFee: swapData.gasFee,
                blockNumber: swapData.blockNumber,
                priceImpact: swapData.priceImpact,
                timestamp: new Date(),
                status: 'pending'
            });

            // Update token prices based on this swap
            await this._updateTokenPricesFromSwap(transaction);

            // Update trading pair statistics
            await this._updateTradingPairFromSwap(transaction);

            logger.info(`Swap transaction recorded: ${swapData.txHash} for user ${userId}`);

            return new SwapTransactionResponseDto(transaction);
        } catch (error) {
            logger.error("Record swap transaction error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to record swap transaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateSwapStatus(txHash: string, status: 'completed' | 'failed'): Promise<SwapTransactionResponseDto> {
        try {
            const updatedTransaction = await this._dexSwapRepository.updateSwapTransaction(txHash, { status });

            if (!updatedTransaction) {
                throw new CustomError("Transaction not found", StatusCode.NOT_FOUND);
            }

            // If completed, update statistics
            if (status === 'completed') {
                await this._updateTradingPairFromSwap(updatedTransaction);
            }

            logger.info(`Swap transaction ${txHash} status updated to ${status}`);

            return new SwapTransactionResponseDto(updatedTransaction);
        } catch (error) {
            logger.error("Update swap status error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to update swap status", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserSwapHistory(userId: string, filters: GetSwapHistoryDto): Promise<SwapHistoryResponseDto> {
        try {
            const { transactions, total } = await this._dexSwapRepository.getUserSwapHistory(
                userId,
                {
                    walletAddress: filters.walletAddress,
                    fromToken: filters.fromToken,
                    toToken: filters.toToken,
                    status: filters.status
                },
                {
                    page: filters.page || 1,
                    limit: filters.limit || 20,
                    sortBy: filters.sortBy || 'timestamp',
                    sortOrder: filters.sortOrder || 'desc'
                }
            );

            const totalPages = Math.ceil(total / (filters.limit || 20));
            const currentPage = filters.page || 1;

            const pagination = {
                currentPage,
                totalPages,
                totalCount: total,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            };

            return new SwapHistoryResponseDto(transactions, pagination);
        } catch (error) {
            logger.error("Get user swap history error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get swap history", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getSwapTransaction(txHash: string): Promise<SwapTransactionResponseDto> {
        try {
            const transaction = await this._dexSwapRepository.getSwapTransactionByHash(txHash);

            if (!transaction) {
                throw new CustomError("Transaction not found", StatusCode.NOT_FOUND);
            }

            return new SwapTransactionResponseDto(transaction);
        } catch (error) {
            logger.error("Get swap transaction error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get swap transaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getChartData(chartQuery: GetChartDataDto): Promise<ChartDataResponseDto> {
        try {
            const chartData = await this._dexSwapRepository.getTokenPricesForChart(
                chartQuery.baseToken,
                chartQuery.quoteToken,
                chartQuery.timeframe,
                chartQuery.limit || 100
            );

            const pair = `${chartQuery.baseToken}/${chartQuery.quoteToken}`;

            return new ChartDataResponseDto(chartData, pair, chartQuery.timeframe);
        } catch (error) {
            logger.error("Get chart data error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get chart data", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateTokenPrice(priceData: UpdatePriceDto): Promise<TokenPriceResponseDto> {
        try {
            const currentPrice = await this._dexSwapRepository.getLatestTokenPrice(priceData.token);

            // Calculate 24h change
            let priceChange24h = 0;
            let priceChangePercent24h = 0;

            if (currentPrice) {
                priceChange24h = priceData.priceInUSD - currentPrice.priceInUSD;
                priceChangePercent24h = currentPrice.priceInUSD > 0
                    ? (priceChange24h / currentPrice.priceInUSD) * 100
                    : 0;
            }

            const newPrice = await this._dexSwapRepository.createTokenPrice({
                token: priceData.token,
                priceInETH: priceData.priceInETH,
                priceInUSD: priceData.priceInUSD,
                volume24h: priceData.volume24h || 0,
                priceChange24h,
                priceChangePercent24h,
                high24h: priceData.priceInUSD,
                low24h: priceData.priceInUSD,
                liquidity: priceData.liquidity || 0,
                marketCap: 0, // Calculate based on supply if available
                totalSupply: 0,
                circulatingSupply: 0,
                blockNumber: priceData.blockNumber || 0,
                timestamp: new Date(),
                source: 'swap'
            });

            return new TokenPriceResponseDto(newPrice);
        } catch (error) {
            logger.error("Update token price error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to update token price", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getTokenPrice(token: string): Promise<TokenPriceResponseDto> {
        try {
            const price = await this._dexSwapRepository.getLatestTokenPrice(token);

            if (!price) {
                // Return default price data if not found
                const defaultPrice = {
                    token,
                    priceInETH: token === 'ETH' ? 1 : 0.001,
                    priceInUSD: token === 'ETH' ? 2000 : 2,
                    priceChange24h: 0,
                    priceChangePercent24h: 0,
                    volume24h: 0,
                    high24h: token === 'ETH' ? 2000 : 2,
                    low24h: token === 'ETH' ? 2000 : 2,
                    marketCap: 0,
                    liquidity: 0,
                    timestamp: new Date()
                };

                return new TokenPriceResponseDto(defaultPrice);
            }

            return new TokenPriceResponseDto(price);
        } catch (error) {
            logger.error("Get token price error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get token price", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getTradingPairStats(baseToken: string, quoteToken: string): Promise<TradingStatsDto> {
        try {
            const pair = await this._dexSwapRepository.getTradingPair(baseToken, quoteToken);

            if (!pair) {
                // Return default stats if pair doesn't exist
                return new TradingStatsDto({
                    baseToken,
                    quoteToken,
                    symbol: `${baseToken}/${quoteToken}`,
                    currentPrice: 0,
                    priceChange24h: 0,
                    priceChangePercent24h: 0,
                    volume24h: 0,
                    high24h: 0,
                    low24h: 0,
                    totalLiquidity: 0,
                    totalTrades: 0,
                    marketCap: 0
                });
            }

            return new TradingStatsDto(pair);
        } catch (error) {
            logger.error("Get trading pair stats error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get trading pair stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getOverallDEXStats(): Promise<any> {
        try {
            return await this._dexSwapRepository.getDEXOverallStats();
        } catch (error) {
            logger.error("Get overall DEX stats error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get DEX stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserTradingStats(userId: string): Promise<any> {
        try {
            return await this._dexSwapRepository.getUserTradingStats(userId);
        } catch (error) {
            logger.error("Get user trading stats error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get user trading stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getTopTradingPairs(): Promise<TradingStatsDto[]> {
        try {
            const pairs = await this._dexSwapRepository.getTopTradingPairs(10);
            return pairs.map(pair => new TradingStatsDto(pair));
        } catch (error) {
            logger.error("Get top trading pairs error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get top trading pairs", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getRecentSwaps(limit: number = 20): Promise<SwapTransactionResponseDto[]> {
        try {
            const swaps = await this._dexSwapRepository.getRecentSwaps(limit);
            return swaps.map(swap => new SwapTransactionResponseDto(swap));
        } catch (error) {
            logger.error("Get recent swaps error:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to get recent swaps", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Background service methods
    async updateAllTokenPrices(): Promise<void> {
        try {
            // This would typically fetch prices from external APIs
            // For now, we'll update based on recent swaps
            const tokens = ['ETH', 'CoinA', 'CoinB'];

            for (const token of tokens) {
                const recentSwaps = await this._dexSwapRepository.getSwapsByPair('ETH', token, 10);
                if (recentSwaps.length > 0) {
                    const latestSwap = recentSwaps[0];
                    const price = this._calculateTokenPrice(latestSwap, token);

                    await this.updateTokenPrice({
                        token: token as any,
                        priceInETH: token === 'ETH' ? 1 : price,
                        priceInUSD: token === 'ETH' ? 2000 : price * 2000, // Assuming ETH = $2000
                        volume24h: 0,
                        liquidity: 0
                    });
                }
            }
        } catch (error) {
            logger.error("Update all token prices error:", error);
        }
    }

    async calculateAndUpdateTradingPairStats(): Promise<void> {
        try {
            const pairs = await this._dexSwapRepository.getAllTradingPairs(true);

            for (const pair of pairs) {
                const recentSwaps = await this._dexSwapRepository.getSwapsByPair(
                    pair.baseToken,
                    pair.quoteToken,
                    100
                );

                if (recentSwaps.length > 0) {
                    const stats = this._calculatePairStats(recentSwaps, pair.baseToken, pair.quoteToken);

                    await this._dexSwapRepository.updateTradingPair(
                        pair.baseToken,
                        pair.quoteToken,
                        stats
                    );
                }
            }
        } catch (error) {
            logger.error("Calculate and update trading pair stats error:", error);
        }
    }

    // Private helper methods
    private async _updateTokenPricesFromSwap(swap: any): Promise<void> {
        try {
            const fromTokenPrice = this._calculateTokenPrice(swap, swap.fromToken);
            const toTokenPrice = this._calculateTokenPrice(swap, swap.toToken);

            // Update both token prices
            if (swap.fromToken !== 'ETH') {
                await this.updateTokenPrice({
                    token: swap.fromToken,
                    priceInETH: fromTokenPrice,
                    priceInUSD: fromTokenPrice * 2000, // Assuming ETH = $2000
                    volume24h: parseFloat(swap.actualFromAmount),
                    blockNumber: swap.blockNumber
                });
            }

            if (swap.toToken !== 'ETH') {
                await this.updateTokenPrice({
                    token: swap.toToken,
                    priceInETH: toTokenPrice,
                    priceInUSD: toTokenPrice * 2000, // Assuming ETH = $2000
                    volume24h: parseFloat(swap.actualToAmount),
                    blockNumber: swap.blockNumber
                });
            }
        } catch (error) {
            logger.error("Update token prices from swap error:", error);
        }
    }

    private async _updateTradingPairFromSwap(swap: any): Promise<void> {
        try {
            const symbol = `${swap.fromToken}/${swap.toToken}`;
            const currentPrice = swap.exchangeRate;

            const pairData = {
                baseToken: swap.fromToken,
                quoteToken: swap.toToken,
                symbol,
                currentPrice,
                volume24h: parseFloat(swap.actualFromAmount),
                totalTrades: 1,
                lastTradeAt: swap.timestamp,
                isActive: true
            };

            await this._dexSwapRepository.updateTradingPair(
                swap.fromToken,
                swap.toToken,
                pairData
            );
        } catch (error) {
            logger.error("Update trading pair from swap error:", error);
        }
    }

    private _calculateTokenPrice(swap: any, token: string): number {
        if (token === 'ETH') {
            return 1; // ETH base price
        }

        if (swap.fromToken === 'ETH' && swap.toToken === token) {
            return parseFloat(swap.actualFromAmount) / parseFloat(swap.actualToAmount);
        } else if (swap.fromToken === token && swap.toToken === 'ETH') {
            return parseFloat(swap.actualToAmount) / parseFloat(swap.actualFromAmount);
        }

        return 0.001; // Default fallback
    }

    private _calculatePairStats(swaps: any[], baseToken: string, quoteToken: string): any {
        const volume24h = swaps.reduce((sum, swap) => {
            return sum + parseFloat(swap.fromToken === baseToken ? swap.actualFromAmount : swap.actualToAmount);
        }, 0);

        const prices = swaps.map(swap => swap.exchangeRate).filter(p => p > 0);
        const high24h = Math.max(...prices, 0);
        const low24h = Math.min(...prices, 0);
        const currentPrice = prices.length > 0 ? prices[0] : 0;

        return {
            volume24h,
            high24h,
            low24h,
            currentPrice,
            totalTrades: swaps.length,
            lastTradeAt: swaps[0]?.timestamp || new Date()
        };
    }
}