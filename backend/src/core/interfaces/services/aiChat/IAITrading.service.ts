import {
    AIChatResponseDto,
    TradeAnalysisDto,
    ChatHistoryResponseDto,
    TokenPriceInfoDto,
    ChatContextDto,
    TradingIntentDto
} from "../../../../dtos/aiTrading/AiTrading.dto";

export interface IAITradingService {
    processMessage(
        message: string,
        sessionId: string,
        userId?: string,
        walletAddress?: string,
        context?: ChatContextDto
    ): Promise<AIChatResponseDto>;

    analyzeTradeOpportunity(
        fromToken: string,
        toToken: string,
        amount: string,
        walletAddress?: string
    ): Promise<TradeAnalysisDto>;

    getAvailableTokens(): Promise<TokenPriceInfoDto[]>;

    calculateSwapEstimate(
        fromToken: string,
        toToken: string,
        amount: string
    ): Promise<{
        estimatedOutput: string;
        priceImpact: string;
        minimumReceived: string;
        gasFee: string;
    }>;

    getChatHistory(
        sessionId: string,
        limit?: number
    ): Promise<ChatHistoryResponseDto>;

    detectTradingIntent(message: string): Promise<TradingIntentDto>;

    generateSmartSuggestions(
        message: string,
        context?: ChatContextDto
    ): Promise<string[]>;
}