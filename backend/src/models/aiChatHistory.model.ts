import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ObjectId } from "mongodb";

export interface IAIChatHistory extends Document {
    _id: ObjectId;
    sessionId: string;
    userId?: ObjectId;
    walletAddress?: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
        context?: {
            walletConnected: boolean;
            tokenPrices?: Record<string, unknown>;
            userBalances?: Record<string, unknown>;
            transactionHash?: string;
        };
    }[];
    metadata: {
        totalMessages: number;
        firstMessageAt: Date;
        lastMessageAt: Date;
        tradingActions: number;
        successfulTrades: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AIChatHistorySchema: Schema<IAIChatHistory> = new Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    walletAddress: { type: String, default: null },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        context: {
            walletConnected: { type: Boolean, default: false },
            tokenPrices: { type: Schema.Types.Mixed },
            userBalances: { type: Schema.Types.Mixed },
            transactionHash: { type: String }
        }
    }],
    metadata: {
        totalMessages: { type: Number, default: 0 },
        firstMessageAt: { type: Date, default: Date.now },
        lastMessageAt: { type: Date, default: Date.now },
        tradingActions: { type: Number, default: 0 },
        successfulTrades: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Indexes for performance
AIChatHistorySchema.index({ sessionId: 1 });
AIChatHistorySchema.index({ userId: 1 });
AIChatHistorySchema.index({ walletAddress: 1 });
AIChatHistorySchema.index({ createdAt: -1 });

export const AIChatHistoryModel: Model<IAIChatHistory> = mongoose.model<IAIChatHistory>('AIChatHistory', AIChatHistorySchema);