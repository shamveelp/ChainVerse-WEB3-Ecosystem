import { IsString, IsOptional, IsBoolean, IsObject } from "class-validator";
import { BaseResponseDto } from "../base/BaseResponse.dto";

export class SendMessageDto {
    @IsString()
    message!: string;

    @IsString()
    sessionId!: string;

    @IsOptional()
    @IsString()
    walletAddress?: string;

    @IsOptional()
    @IsBoolean()
    walletConnected?: boolean;

    @IsOptional()
    @IsObject()
    context?: {
        tokenPrices?: any;
        userBalances?: any;
        recentTransaction?: string;
    };
}

export class ExecuteTradeDto {
    @IsString()
    fromToken!: string;

    @IsString()
    toToken!: string;

    @IsString()
    amount!: string;

    @IsString()
    sessionId!: string;

    @IsString()
    walletAddress!: string;

    @IsOptional()
    @IsString()
    slippage?: string;
}

export class GetChatHistoryDto {
    @IsString()
    sessionId!: string;

    @IsOptional()
    @IsString()
    limit?: string;
}

export class ChatMessageResponseDto {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: {
        walletConnected: boolean;
        tokenPrices?: any;
        userBalances?: any;
        transactionHash?: string;
    };

    constructor(message: any) {
        this.role = message.role;
        this.content = message.content;
        this.timestamp = message.timestamp;
        this.context = message.context;
    }
}

export class AIChatResponseDto extends BaseResponseDto {
    response: string;
    sessionId: string;
    suggestions?: string[];
    actionRequired?: {
        type: 'connect_wallet' | 'approve_token' | 'execute_trade';
        message: string;
        data?: any;
    };

    constructor(
        response: string,
        sessionId: string,
        suggestions?: string[],
        actionRequired?: any
    ) {
        super(true, "AI response generated successfully");
        this.response = response;
        this.sessionId = sessionId;
        this.suggestions = suggestions;
        this.actionRequired = actionRequired;
    }
}

export class TradeAnalysisDto extends BaseResponseDto {
    analysis: string;
    estimatedOutput: string;
    priceImpact: string;
    gasFee: string;
    recommendation: 'buy' | 'sell' | 'hold' | 'caution';
    riskLevel: 'low' | 'medium' | 'high';

    constructor(data: any) {
        super(true, "Trade analysis completed successfully");
        this.analysis = data.analysis;
        this.estimatedOutput = data.estimatedOutput;
        this.priceImpact = data.priceImpact;
        this.gasFee = data.gasFee;
        this.recommendation = data.recommendation;
        this.riskLevel = data.riskLevel;
    }
}

export class ChatHistoryResponseDto extends BaseResponseDto {
    messages: ChatMessageResponseDto[];
    metadata: {
        totalMessages: number;
        firstMessageAt: Date;
        lastMessageAt: Date;
        tradingActions: number;
        successfulTrades: number;
    };

    constructor(chatHistory: any) {
        super(true, "Chat history retrieved successfully");
        this.messages = chatHistory.messages.map((msg: any) => new ChatMessageResponseDto(msg));
        this.metadata = chatHistory.metadata;
    }
}

export class TokenPriceInfoDto {
    symbol: string;
    name: string;
    priceInETH: string;
    priceInUSD?: string;
    change24h?: string;
    volume24h?: string;

    constructor(data: any) {
        this.symbol = data.symbol;
        this.name = data.name;
        this.priceInETH = data.priceInETH;
        this.priceInUSD = data.priceInUSD;
        this.change24h = data.change24h;
        this.volume24h = data.volume24h;
    }
}

export class TradeExecutionResponseDto extends BaseResponseDto {
    transactionHash: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    exchangeRate: string;
    gasFee: string;
    explorerUrl: string;

    constructor(data: any) {
        super(true, "Trade executed successfully");
        this.transactionHash = data.transactionHash;
        this.fromToken = data.fromToken;
        this.toToken = data.toToken;
        this.fromAmount = data.fromAmount;
        this.toAmount = data.toAmount;
        this.exchangeRate = data.exchangeRate;
        this.gasFee = data.gasFee;
        this.explorerUrl = data.explorerUrl;
    }
}