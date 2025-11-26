import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IAITradingService } from "../../core/interfaces/services/aiChat/IAITradingService";
import { IAIChatHistoryRepository } from "../../core/interfaces/repositories/aiChat/IAIChatHistory.repository";
import { IDexRepository } from "../../core/interfaces/repositories/IDexRepository";
import { langChainConfig } from "../../config/langchain.config";
import { 
    AIChatResponseDto, 
    TradeAnalysisDto, 
    ChatHistoryResponseDto,
    TokenPriceInfoDto
} from "../../dtos/aiTrading/AiTrading.dto";
import logger from "../../utils/logger";

@injectable()
export class AITradingService implements IAITradingService {
    constructor(
        @inject(TYPES.IAIChatHistoryRepository) private _chatHistoryRepository: IAIChatHistoryRepository,
        @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
    ) {}

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
                aiResponse = await this.handleTradingQuery(message, intent, context);
                
                // Check if wallet connection required
                if (!walletAddress && (intent.action === 'buy' || intent.action === 'sell' || intent.action === 'swap')) {
                    actionRequired = {
                        type: 'connect_wallet',
                        message: 'Please connect your wallet to execute trades',
                        data: { intent }
                    };
                }
                
                suggestions = await this.generateTradingSuggestions(intent, context);
            } else {
                aiResponse = await this.handleGeneralQuery(message, context);
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
            logger.error('Error processing AI message:', error);
            const fallbackResponse = "I'm having trouble processing your request right now. Please try again! 🤖";
            return new AIChatResponseDto(fallbackResponse, sessionId);
        }
    }

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
            logger.error('Error analyzing trade opportunity:', error);
            throw error;
        }
    }

    async getAvailableTokens(): Promise<TokenPriceInfoDto[]> {
        try {
            const tokens = [
                {
                    symbol: 'ETH',
                    name: 'Ethereum',
                    priceInETH: '1.0',
                    priceInUSD: '2800.00',
                    change24h: '+2.5%',
                    volume24h: '$4.7M'
                },
                {
                    symbol: 'CoinA',
                    name: 'Coin Alpha',
                    priceInETH: '0.000847',
                    priceInUSD: '2.37',
                    change24h: '+5.2%',
                    volume24h: '$1.2M'
                },
                {
                    symbol: 'CoinB',
                    name: 'Coin Beta',
                    priceInETH: '0.001234',
                    priceInUSD: '3.45',
                    change24h: '-1.8%',
                    volume24h: '$890K'
                }
            ];

            return tokens.map(token => new TokenPriceInfoDto(token));
        } catch (error) {
            logger.error('Error getting available tokens:', error);
            throw error;
        }
    }

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
            // Mock calculation - in production, this would call actual DEX contracts
            const inputAmount = parseFloat(amount);
            let exchangeRate = 1;

            // Simple exchange rate calculation based on token pair
            if (fromToken === 'ETH' && toToken === 'CoinA') {
                exchangeRate = 1180.5; // 1 ETH = ~1180 CoinA
            } else if (fromToken === 'ETH' && toToken === 'CoinB') {
                exchangeRate = 810.2; // 1 ETH = ~810 CoinB
            } else if (fromToken === 'CoinA' && toToken === 'ETH') {
                exchangeRate = 0.000847;
            } else if (fromToken === 'CoinB' && toToken === 'ETH') {
                exchangeRate = 0.001234;
            } else if (fromToken === 'CoinA' && toToken === 'CoinB') {
                exchangeRate = 1.45;
            } else if (fromToken === 'CoinB' && toToken === 'CoinA') {
                exchangeRate = 0.69;
            }

            const estimatedOutput = inputAmount * exchangeRate;
            const priceImpact = Math.min(inputAmount * 0.1, 5); // Simple price impact calculation
            const minimumReceived = estimatedOutput * 0.995; // 0.5% slippage
            const gasFee = '0.008'; // Fixed gas fee estimate

            return {
                estimatedOutput: estimatedOutput.toFixed(6),
                priceImpact: priceImpact.toFixed(2),
                minimumReceived: minimumReceived.toFixed(6),
                gasFee
            };
        } catch (error) {
            logger.error('Error calculating swap estimate:', error);
            throw error;
        }
    }

    async getChatHistory(
        sessionId: string,
        limit: number = 20
    ): Promise<ChatHistoryResponseDto> {
        try {
            const chatHistory = await this._chatHistoryRepository.getSessionHistory(sessionId, limit);
            
            if (!chatHistory) {
                throw new Error('Chat session not found');
            }

            return new ChatHistoryResponseDto(chatHistory);
        } catch (error) {
            logger.error('Error getting chat history:', error);
            throw error;
        }
    }

    async detectTradingIntent(message: string): Promise<{
        isTradeIntent: boolean;
        fromToken?: string;
        toToken?: string;
        amount?: string;
        action: 'buy' | 'sell' | 'swap' | 'info' | 'general';
    }> {
        const lowerMessage = message.toLowerCase();
        
        // Detect tokens
        const tokens = ['eth', 'coina', 'coinb'];
        const foundTokens = tokens.filter(token => lowerMessage.includes(token));
        
        // Detect amounts
        const amountRegex = /\b\d+(?:\.\d+)?\b/g;
        const amounts = lowerMessage.match(amountRegex);
        
        // Detect trading keywords
        const buyKeywords = ['buy', 'purchase', 'get'];
        const sellKeywords = ['sell', 'dispose'];
        const swapKeywords = ['swap', 'exchange', 'trade', 'convert'];
        const infoKeywords = ['price', 'cost', 'worth', 'value', 'how much'];
        
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
        
        return {
            isTradeIntent,
            fromToken: foundTokens[0]?.toUpperCase(),
            toToken: foundTokens[1]?.toUpperCase(),
            amount: amounts?.[0],
            action
        };
    }

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
        context?: any
    ): Promise<string> {
        const aiContext = {
            walletConnected: !!context?.walletAddress,
            tokenPrices: await this.getCurrentTokenPrices(),
            userBalances: context?.userBalances,
            recentTransaction: context?.recentTransaction
        };

        return await langChainConfig.generateResponse(message, aiContext);
    }

    private async handleGeneralQuery(message: string, context?: any): Promise<string> {
        const aiContext = {
            walletConnected: !!context?.walletAddress,
            tokenPrices: await this.getCurrentTokenPrices(),
            userBalances: context?.userBalances
        };

        return await langChainConfig.generateResponse(message, aiContext);
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
        // Mock prices - in production, fetch from DEX contracts or price feeds
        return {
            ETH: { price: 2800, change24h: 2.5 },
            CoinA: { price: 2.37, priceInETH: 0.000847, change24h: 5.2 },
            CoinB: { price: 3.45, priceInETH: 0.001234, change24h: -1.8 }
        };
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