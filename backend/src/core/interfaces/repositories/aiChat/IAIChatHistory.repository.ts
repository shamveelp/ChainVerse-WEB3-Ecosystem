import { IAIChatHistory } from "../../../../models/aiChatHistory.model";

export interface IAIChatHistoryRepository {
    createOrUpdateSession(
        sessionId: string, 
        userId?: string, 
        walletAddress?: string
    ): Promise<IAIChatHistory>;
    
    addMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        context?: any
    ): Promise<IAIChatHistory>;
    
    getSessionHistory(
        sessionId: string,
        limit?: number
    ): Promise<IAIChatHistory | null>;
    
    getUserChatHistories(
        userId: string,
        limit?: number
    ): Promise<IAIChatHistory[]>;
    
    getSessionsByWallet(
        walletAddress: string,
        limit?: number
    ): Promise<IAIChatHistory[]>;
    
    updateTradingStats(
        sessionId: string,
        successful: boolean
    ): Promise<void>;
    
    cleanupOldSessions(daysOld: number): Promise<number>;
}