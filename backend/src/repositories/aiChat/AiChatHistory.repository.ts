import { injectable } from "inversify";
import { IAIChatHistoryRepository } from "../../core/interfaces/repositories/aiChat/IAIChatHistory.repository";
import { AIChatHistoryModel, IAIChatHistory } from "../../models/aiChatHistory.model";
import { UpdateQuery, Types } from "mongoose";
import logger from "../../utils/logger";

@injectable()
export class AIChatHistoryRepository implements IAIChatHistoryRepository {
    async createOrUpdateSession(
        sessionId: string,
        userId?: string,
        walletAddress?: string
    ): Promise<IAIChatHistory> {
        try {
            let chatHistory = await AIChatHistoryModel.findOne({ sessionId });

            if (!chatHistory) {
                chatHistory = new AIChatHistoryModel({
                    sessionId,
                    userId: userId || null,
                    walletAddress: walletAddress || null,
                    messages: [],
                    metadata: {
                        totalMessages: 0,
                        firstMessageAt: new Date(),
                        lastMessageAt: new Date(),
                        tradingActions: 0,
                        successfulTrades: 0
                    }
                });
                await chatHistory.save();
                logger.info(`Created new AI chat session: ${sessionId}`);
            } else {
                // Update user/wallet info if provided
                let updated = false;
                if (userId && !chatHistory.userId) {
                    chatHistory.userId = new Types.ObjectId(userId);
                    updated = true;
                }
                if (walletAddress && !chatHistory.walletAddress) {
                    chatHistory.walletAddress = walletAddress;
                    updated = true;
                }
                if (updated) {
                    await chatHistory.save();
                }
            }

            return chatHistory;
        } catch (error) {
            logger.error('Error creating/updating chat session:', error);
            throw error;
        }
    }

    async addMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        context?: { walletConnected: boolean;[key: string]: unknown }
    ): Promise<IAIChatHistory> {
        try {
            const chatHistory = await AIChatHistoryModel.findOne({ sessionId });
            if (!chatHistory) {
                throw new Error(`Chat session not found: ${sessionId}`);
            }

            chatHistory.messages.push({
                role,
                content,
                timestamp: new Date(),
                context: context || { walletConnected: false }
            });

            // Update metadata
            chatHistory.metadata.totalMessages = chatHistory.messages.length;
            chatHistory.metadata.lastMessageAt = new Date();

            if (role === 'user' && this.detectTradingKeywords(content)) {
                chatHistory.metadata.tradingActions += 1;
            }

            await chatHistory.save();
            return chatHistory;
        } catch (error) {
            logger.error('Error adding message to chat history:', error);
            throw error;
        }
    }

    async getSessionHistory(
        sessionId: string,
        limit: number = 50
    ): Promise<IAIChatHistory | null> {
        try {
            const chatHistory = await AIChatHistoryModel.findOne({ sessionId });

            if (chatHistory && limit > 0) {
                // Limit messages if specified
                const messages = chatHistory.messages.slice(-limit);
                return {
                    ...chatHistory.toObject(),
                    messages
                } as unknown as IAIChatHistory;
            }

            return chatHistory;
        } catch (error) {
            logger.error('Error getting session history:', error);
            throw error;
        }
    }

    async getUserChatHistories(
        userId: string,
        limit: number = 10
    ): Promise<IAIChatHistory[]> {
        try {
            return await AIChatHistoryModel
                .find({ userId })
                .sort({ updatedAt: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            logger.error('Error getting user chat histories:', error);
            throw error;
        }
    }

    async getSessionsByWallet(
        walletAddress: string,
        limit: number = 10
    ): Promise<IAIChatHistory[]> {
        try {
            return await AIChatHistoryModel
                .find({ walletAddress })
                .sort({ updatedAt: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            logger.error('Error getting sessions by wallet:', error);
            throw error;
        }
    }

    async updateTradingStats(
        sessionId: string,
        successful: boolean
    ): Promise<void> {
        try {
            const update: UpdateQuery<IAIChatHistory> = {};
            if (successful) {
                update['$inc'] = { 'metadata.successfulTrades': 1 };
            }

            await AIChatHistoryModel.findOneAndUpdate(
                { sessionId },
                update
            );
        } catch (error) {
            logger.error('Error updating trading stats:', error);
            throw error;
        }
    }

    async cleanupOldSessions(daysOld: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await AIChatHistoryModel.deleteMany({
                updatedAt: { $lt: cutoffDate }
            });

            logger.info(`Cleaned up ${result.deletedCount} old AI chat sessions`);
            return result.deletedCount || 0;
        } catch (error) {
            logger.error('Error cleaning up old sessions:', error);
            throw error;
        }
    }

    private detectTradingKeywords(content: string): boolean {
        const tradingKeywords = [
            'swap', 'trade', 'buy', 'sell', 'exchange',
            'price', 'token', 'eth', 'coina', 'coinb'
        ];

        const lowerContent = content.toLowerCase();
        return tradingKeywords.some(keyword => lowerContent.includes(keyword));
    }
}