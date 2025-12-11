export interface AIChatMessageRequest {
    message: string;
    sessionId: string;
    walletAddress?: string;
    walletConnected?: boolean;
    context?: any;
}

export interface AIChatResponse {
    response: string;
    action?: 'buy' | 'sell' | 'swap' | 'info' | 'general';
    tokens?: string[];
    amount?: string;
}

export interface AIAnalysisRequest {
    fromToken: string;
    toToken: string;
    amount: string;
    walletAddress?: string;
}

export interface AIExecuteTradeRequest {
    fromToken: string;
    toToken: string;
    amount: string;
    sessionId: string;
    walletAddress: string;
    slippage?: string;
}

export interface AIParseIntentResult {
    isTradeIntent: boolean;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    action: 'buy' | 'sell' | 'swap' | 'info' | 'general';
}

export interface AITradeDetails {
    hasTradeDetails: boolean;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    estimatedOutput?: string;
}
