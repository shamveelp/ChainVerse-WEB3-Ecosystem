import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IAITradingService } from "../../core/interfaces/services/aiChat/IAITrading.service";
import { IAIChatHistoryRepository } from "../../core/interfaces/repositories/aiChat/IAIChatHistory.repository";
import { IDexRepository } from "../../core/interfaces/repositories/IDex.repository";
import { langChainConfig } from "../../config/langchain.config";
import {
    AIChatResponseDto,
    TradeAnalysisDto,
    ChatHistoryResponseDto,
    TokenPriceInfoDto
} from "../../dtos/aiTrading/AiTrading.dto";
import logger from "../../utils/logger";
import axios from 'axios';
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class AITradingService implements IAITradingService {
    constructor(
        @inject(TYPES.IAIChatHistoryRepository) private _chatHistoryRepository: IAIChatHistoryRepository,
        @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
    ) { }

    /**
     * Processes a user message for AI trading chat.
     * @param {string} message - User message.
     * @param {string} sessionId - Session ID.
     * @param {string} [userId] - User ID.
     * @param {string} [walletAddress] - Wallet address.
     * @param {any} [context] - Additional context.
     * @returns {Promise<AIChatResponseDto>} AI response.
     */
    async processMessage(
        message: string,
        sessionId: string,
        userId?: string,
        walletAddress?: string,
        context?: any
    ): Promise<AIChatResponseDto> {
        try {
            // Create or get session
            await this._chatHistoryRepository.createOrUpdateSession(
                sessionId,
                userId,
                walletAddress
            );

            // Add user message to history
            await this._chatHistoryRepository.addMessage(
                sessionId,
                'user',
                message,
                context
            );

            // Detect trading intent
            const intent = await this.detectTradingIntent(message);

            // Generate AI response based on intent    
            let aiResponse: string;
            let actionRequired: any = null;
            let suggestions: string[] = [];

            if (intent.isTradeIntent) {
                aiResponse = await this.handleTradingQuery(message, intent, context, walletAddress);

                // Check if wallet connection required 
                if (!walletAddress && (intent.action === 'buy' || intent.action === 'sell' || intent.action === 'swap')) {
                    actionRequired = {
                        type: 'connect_wallet',
                        message: ErrorMessages.CONNECT_WALLET_MSG,
                        data: { intent }
                    };
                }

                suggestions = await this.generateTradingSuggestions(intent, context);
            } else {
                aiResponse = await this.handleGeneralQuery(message, context, walletAddress);
                suggestions = [
                    "What tokens are available to trade? 📊",
                    "Show me current prices 💰",
                    "How do I swap ETH for CoinA? 🔄",
                    "Calculate swap for 0.01 ETH ⚡"
                ];
            }

            // Add AI response to history
            await this._chatHistoryRepository.addMessage(
                sessionId,
                'assistant',
                aiResponse,
                { ...context, suggestions, actionRequired }
            );

            return new AIChatResponseDto(aiResponse, sessionId, suggestions, actionRequired);
        } catch (error) {
            logger.error(LoggerMessages.AI_PROCESSING_ERROR, error);
            const fallbackResponse = ErrorMessages.AI_PROCESSING_FALLBACK;
            return new AIChatResponseDto(fallbackResponse, sessionId);
        }
    }

    /**
     * Analyzes a potential trade.
     * @param {string} fromToken - Source token symbol.
     * @param {string} toToken - Target token symbol.
     * @param {string} amount - Amount to trade.
     * @param {string} [walletAddress] - Wallet address.
     * @returns {Promise<TradeAnalysisDto>} Trade analysis.
     */
    async analyzeTradeOpportunity(
        fromToken: string,
        toToken: string,
        amount: string,
        walletAddress?: string
    ): Promise<TradeAnalysisDto> {
        try {
            // Get current token prices
            const tokenPrices = await this.getCurrentTokenPrices();

            // Calculate estimated output
            const swapEstimate = await this.calculateSwapEstimate(fromToken, toToken, amount);

            // Generate AI analysis
            const analysis = await langChainConfig.generateTradeAnalysis(
                fromToken,
                toToken,
                amount,
                tokenPrices
            );

            // Calculate risk level based on amount and price impact
            const riskLevel = this.calculateRiskLevel(
                parseFloat(amount),
                parseFloat(swapEstimate.priceImpact)
            );

            return new TradeAnalysisDto({
                analysis,
                estimatedOutput: swapEstimate.estimatedOutput,
                priceImpact: swapEstimate.priceImpact,
                gasFee: swapEstimate.gasFee,
                recommendation: this.getTradeRecommendation(riskLevel, parseFloat(swapEstimate.priceImpact)),
                riskLevel
            });
        } catch (error) {
            logger.error(LoggerMessages.ANALYZE_TRADE_ERROR, error);
            throw error;
        }
    }

    /**
     * Retrieves available tokens and their prices.
     * @returns {Promise<TokenPriceInfoDto[]>} List of tokens.
     */
    async getAvailableTokens(): Promise<TokenPriceInfoDto[]> {
        try {
            const realPrices = await this.getCurrentTokenPrices();

            const tokens = [
                {
                    symbol: 'ETH',
                    name: 'Ethereum (Sepolia)',
                    priceInETH: '1.0',
                    priceInUSD: realPrices.ETH?.priceInUSD || '2800.00',
                    change24h: realPrices.ETH?.change24h || '+2.5%',
                    volume24h: '$4.7M'
                },
                {
                    symbol: 'CoinA',
                    name: 'Coin Alpha',
                    priceInETH: realPrices.CoinA?.priceInETH || '0.000847',
                    priceInUSD: realPrices.CoinA?.priceInUSD || '2.37',
                    change24h: realPrices.CoinA?.change24h || '+5.2%',
                    volume24h: '$1.2M'
                },
                {
                    symbol: 'CoinB',
                    name: 'Coin Beta',
                    priceInETH: realPrices.CoinB?.priceInETH || '0.001234',
                    priceInUSD: realPrices.CoinB?.priceInUSD || '3.45',
                    change24h: realPrices.CoinB?.change24h || '-1.8%',
                    volume24h: '$890K'
                }
            ];

            return tokens.map(token => new TokenPriceInfoDto(token));
        } catch (error) {
            logger.error(LoggerMessages.GET_AVAILABLE_TOKENS_ERROR, error);
            throw error;
        }
    }

    /**
     * Calculates swap details.
     * @param {string} fromToken - Source token.
     * @param {string} toToken - Target token.
     * @param {string} amount - Amount to swap.
     * @returns {Promise<Object>} Swap estimates.
     */
    async calculateSwapEstimate(
        fromToken: string,
        toToken: string,
        amount: string
    ): Promise<{
        estimatedOutput: string;
        priceImpact: string;
        minimumReceived: string;
        gasFee: string;
    }> {
        try {
            const inputAmount = parseFloat(amount);
            let exchangeRate = 1;

            // Get real-time prices for better estimates
            const tokenPrices = await this.getCurrentTokenPrices();

            // Calculate exchange rate based on real prices if available
            if (fromToken === 'ETH' && toToken === 'CoinA') {
                exchangeRate = tokenPrices.CoinA?.exchangeRate || 1180.5;
            } else if (fromToken === 'ETH' && toToken === 'CoinB') {
                exchangeRate = tokenPrices.CoinB?.exchangeRate || 810.2;
            } else if (fromToken === 'CoinA' && toToken === 'ETH') {
                exchangeRate = 1 / (tokenPrices.CoinA?.exchangeRate || 1180.5);
            } else if (fromToken === 'CoinB' && toToken === 'ETH') {
                exchangeRate = 1 / (tokenPrices.CoinB?.exchangeRate || 810.2);
            } else if (fromToken === 'CoinA' && toToken === 'CoinB') {
                const coinAToETH = 1 / (tokenPrices.CoinA?.exchangeRate || 1180.5);
                const ethToCoinB = tokenPrices.CoinB?.exchangeRate || 810.2;
                exchangeRate = coinAToETH * ethToCoinB;
            } else if (fromToken === 'CoinB' && toToken === 'CoinA') {
                const coinBToETH = 1 / (tokenPrices.CoinB?.exchangeRate || 810.2);
                const ethToCoinA = tokenPrices.CoinA?.exchangeRate || 1180.5;
                exchangeRate = coinBToETH * ethToCoinA;
            }

            const estimatedOutput = inputAmount * exchangeRate;
            const priceImpact = Math.min(inputAmount * 0.1, 5);
            const minimumReceived = estimatedOutput * 0.995;
            const gasFee = this.calculateGasFee(fromToken, toToken);

            return {
                estimatedOutput: estimatedOutput.toFixed(6),
                priceImpact: priceImpact.toFixed(2),
                minimumReceived: minimumReceived.toFixed(6),
                gasFee
            };
        } catch (error) {
            logger.error(LoggerMessages.CALCULATE_SWAP_ERROR, error);
            throw error;
        }
    }

    /**
     * Retrieves chat history for a session.
     * @param {string} sessionId - Session ID.
     * @param {number} [limit=20] - Number of messages.
     * @returns {Promise<ChatHistoryResponseDto>} Chat history.
     */
    async getChatHistory(
        sessionId: string,
        limit: number = 20
    ): Promise<ChatHistoryResponseDto> {
        try {
            const chatHistory = await this._chatHistoryRepository.getSessionHistory(sessionId, limit);

            if (!chatHistory) {
                throw new Error(ErrorMessages.CHAT_SESSION_NOT_FOUND);
            }

            return new ChatHistoryResponseDto(chatHistory);
        } catch (error) {
            logger.error(LoggerMessages.GET_CHAT_HISTORY_ERROR, error);
            throw error;
        }
    }

    /**
     * Detects trading intent from a message.
     * @param {string} message - User message.
     * @returns {Promise<Object>} Detected intent.
     */
    async detectTradingIntent(message: string): Promise<{
        isTradeIntent: boolean;
        fromToken?: string;
        toToken?: string;
        amount?: string;
        action: 'buy' | 'sell' | 'swap' | 'info' | 'general';
    }> {
        const lowerMessage = message.toLowerCase();

        // Detect tokens - improved detection
        const tokens = ['eth', 'ethereum', 'coina', 'coinb', 'coin a', 'coin b'];
        const foundTokens = tokens.filter(token => lowerMessage.includes(token));

        // Detect amounts - improved regex
        const amountRegex = /\b(\d+(?:\.\d+)?)\b/g;
        const amounts = lowerMessage.match(amountRegex);

        // Detect trading keywords
        const buyKeywords = ['buy', 'purchase', 'get', 'acquire'];
        const sellKeywords = ['sell', 'dispose', 'liquidate'];
        const swapKeywords = ['swap', 'exchange', 'trade', 'convert', 'change'];
        const infoKeywords = ['price', 'cost', 'worth', 'value', 'how much', 'current', 'rate'];

        const isBuy = buyKeywords.some(keyword => lowerMessage.includes(keyword));
        const isSell = sellKeywords.some(keyword => lowerMessage.includes(keyword));
        const isSwap = swapKeywords.some(keyword => lowerMessage.includes(keyword));
        const isInfo = infoKeywords.some(keyword => lowerMessage.includes(keyword));

        const isTradeIntent = isBuy || isSell || isSwap || isInfo || foundTokens.length > 0;

        let action: 'buy' | 'sell' | 'swap' | 'info' | 'general' = 'general';
        if (isBuy) action = 'buy';
        else if (isSell) action = 'sell';
        else if (isSwap) action = 'swap';
        else if (isInfo) action = 'info';

        // Normalize found tokens
        const normalizedTokens = foundTokens.map(token => {
            if (token.includes('eth') || token === 'ethereum') return 'ETH';
            if (token.includes('coina') || token === 'coin a') return 'CoinA';
            if (token.includes('coinb') || token === 'coin b') return 'CoinB';
            return token.toUpperCase();
        }).filter((token, index, self) => self.indexOf(token) === index);

        return {
            isTradeIntent,
            fromToken: normalizedTokens[0],
            toToken: normalizedTokens[1],
            amount: amounts?.[0],
            action
        };
    }

    /**
     * Generates smart suggestions based on user message.
     * @param {string} message - User message.
     * @param {any} [context] - Context.
     * @returns {Promise<string[]>} Suggestions.
     */
    async generateSmartSuggestions(
        message: string,
        context?: any
    ): Promise<string[]> {
        const intent = await this.detectTradingIntent(message);

        if (intent.isTradeIntent) {
            return this.generateTradingSuggestions(intent, context);
        } else {
            return [
                "What tokens can I trade? 📊",
                "Show current token prices 💰",
                "How to swap 0.01 ETH for CoinA? 🔄",
                "What's the best trading strategy? 🎯"
            ];
        }
    }

    private async handleTradingQuery(
        message: string,
        intent: any,
        context?: any,
        walletAddress?: string
    ): Promise<string> {
        const aiContext = {
            walletConnected: !!walletAddress,
            tokenPrices: await this.getCurrentTokenPrices(),
            userBalances: context?.userBalances,
            recentTransaction: context?.recentTransaction
        };

        // Handle specific trading actions
        if (intent.action === 'info' && intent.fromToken && intent.toToken) {
            return await this.generatePriceInfo(intent.fromToken, intent.toToken);
        }

        if (intent.action === 'swap' && intent.fromToken && intent.toToken && intent.amount) {
            if (walletAddress) {
                return await this.generateSwapProposal(intent.fromToken, intent.toToken, intent.amount, walletAddress);
            } else {
                return `I can help you swap ${intent.amount} ${intent.fromToken} for ${intent.toToken}! 🔄\n\nHowever, I need you to connect your wallet first to proceed with the trade. Once connected, I can:\n\n✅ Calculate the exact output amount\n✅ Check your balance\n✅ Execute the swap for you\n\nPlease connect your wallet and try again! 💫`;
            }
        }

        return await langChainConfig.generateResponse(message, aiContext);
    }

    private async handleGeneralQuery(
        message: string,
        context?: any,
        walletAddress?: string
    ): Promise<string> {
        const aiContext = {
            walletConnected: !!walletAddress,
            tokenPrices: await this.getCurrentTokenPrices(),
            userBalances: context?.userBalances
        };

        return await langChainConfig.generateResponse(message, aiContext);
    }

    private async generatePriceInfo(fromToken: string, toToken: string): Promise<string> {
        try {
            const estimate = await this.calculateSwapEstimate(fromToken, toToken, '1');
            const tokenPrices = await this.getCurrentTokenPrices();

            return `💰 **Current ${fromToken}/${toToken} Trading Information**
            
**Exchange Rate:**
• 1 ${fromToken} = ${estimate.estimatedOutput} ${toToken}

**Market Data:**
• ${fromToken} Price: ${tokenPrices[fromToken]?.priceInUSD || 'N/A'} USD
• ${toToken} Price: ${tokenPrices[toToken]?.priceInUSD || 'N/A'} USD
• Estimated Gas Fee: ${estimate.gasFee} ETH

**Trading Info:**
• Price Impact: ${estimate.priceImpact}%
• Minimum Received (0.5% slippage): ${estimate.minimumReceived} ${toToken}

Ready to make a trade? Just tell me the amount you want to swap! 🚀`;

        } catch (error) {
            logger.error(LoggerMessages.GENERATE_PRICE_INFO_ERROR, error);
            // Fallback
            return `I'm having trouble fetching the current price for ${fromToken}/${toToken}. Please try again! 📊`;
        }
    }

    private async generateSwapProposal(
        fromToken: string,
        toToken: string,
        amount: string,
        walletAddress: string
    ): Promise<string> {
        try {
            const estimate = await this.calculateSwapEstimate(fromToken, toToken, amount);

            return `🔄 **Swap Proposal Ready!**

**Trade Details:**
• Swap: ${amount} ${fromToken} → ${estimate.estimatedOutput} ${toToken}
• Exchange Rate: 1 ${fromToken} = ${(parseFloat(estimate.estimatedOutput) / parseFloat(amount)).toFixed(6)} ${toToken}
• Price Impact: ${estimate.priceImpact}%
• Gas Fee: ~${estimate.gasFee} ETH

**Your Wallet:** ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}

**Next Steps:**
1. I'll request token approval if needed
2. Execute the swap transaction
3. Confirm on blockchain

Ready to proceed? Type "**execute trade**" or click the trade button! ✨

*Note: Always verify transaction details before confirming!* ⚠️`;

        } catch (error) {
            logger.error(LoggerMessages.GENERATE_SWAP_PROPOSAL_ERROR, error);
            return ErrorMessages.AI_SWAP_ERROR;
        }
    }

    private async generateTradingSuggestions(intent: any, context?: any): Promise<string[]> {
        const suggestions = [];

        if (intent.action === 'info') {
            suggestions.push(
                "Check current ETH/CoinA price 📈",
                "Calculate swap for different amount 🔢",
                "View 24h price changes 📊"
            );
        } else if (intent.action === 'swap' || intent.action === 'buy') {
            suggestions.push(
                "Execute this trade 🚀",
                "Analyze price impact ⚠️",
                "Check slippage settings ⚙️"
            );
        }

        suggestions.push("View trading guide 📚");

        return suggestions;
    }

    private async getCurrentTokenPrices(): Promise<any> {
        try {
            // Try to fetch real ETH price from CoinGecko
            let ethPriceUSD = 2800;
            try {
                const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
                    timeout: 5000
                });
                if (response.data?.ethereum?.usd) {
                    ethPriceUSD = response.data.ethereum.usd;
                }
            } catch (apiError) {
                logger.warn(LoggerMessages.FETCH_ETH_PRICE_WARNING, apiError);
            }

            // Calculate derived prices for test tokens
            const coinAExchangeRate = 1180.5; // 1 ETH = 1180.5 CoinA
            const coinBExchangeRate = 810.2;  // 1 ETH = 810.2 CoinB

            const coinAPriceUSD = ethPriceUSD / coinAExchangeRate;
            const coinBPriceUSD = ethPriceUSD / coinBExchangeRate;

            return {
                ETH: {
                    price: ethPriceUSD,
                    priceInUSD: ethPriceUSD.toFixed(2),
                    priceInETH: '1.0',
                    change24h: '+2.5%',
                    exchangeRate: 1
                },
                CoinA: {
                    price: coinAPriceUSD,
                    priceInUSD: coinAPriceUSD.toFixed(2),
                    priceInETH: (1 / coinAExchangeRate).toFixed(6),
                    change24h: '+5.2%',
                    exchangeRate: coinAExchangeRate
                },
                CoinB: {
                    price: coinBPriceUSD,
                    priceInUSD: coinBPriceUSD.toFixed(2),
                    priceInETH: (1 / coinBExchangeRate).toFixed(6),
                    change24h: '-1.8%',
                    exchangeRate: coinBExchangeRate
                }
            };
        } catch (error) {
            logger.error(LoggerMessages.FETCH_TOKEN_PRICES_ERROR, error);
            // Return fallback prices
            return {
                ETH: { price: 2800, priceInUSD: '2800.00', priceInETH: '1.0', change24h: '+2.5%', exchangeRate: 1 },
                CoinA: { price: 2.37, priceInUSD: '2.37', priceInETH: '0.000847', change24h: '+5.2%', exchangeRate: 1180.5 },
                CoinB: { price: 3.45, priceInUSD: '3.45', priceInETH: '0.001234', change24h: '-1.8%', exchangeRate: 810.2 }
            };
        }
    }

    private calculateGasFee(fromToken: string, toToken: string): string {
        // Different gas fees based on trade type
        if (fromToken === 'ETH' || toToken === 'ETH') {
            return '0.008'; // ETH trades
        } else {
            return '0.012'; // Token-to-token trades (more complex)
        }
    }

    private calculateRiskLevel(amount: number, priceImpact: number): 'low' | 'medium' | 'high' {
        if (priceImpact > 5 || amount > 1) return 'high';
        if (priceImpact > 2 || amount > 0.1) return 'medium';
        return 'low';
    }

    private getTradeRecommendation(
        riskLevel: 'low' | 'medium' | 'high',
        priceImpact: number
    ): 'buy' | 'sell' | 'hold' | 'caution' {
        if (riskLevel === 'high' || priceImpact > 5) return 'caution';
        if (priceImpact < 1) return 'buy';
        if (priceImpact < 3) return 'hold';
        return 'caution';
    }
}