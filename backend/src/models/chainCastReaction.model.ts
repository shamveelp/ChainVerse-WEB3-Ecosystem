import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChainCastReaction extends Document {
    _id: Types.ObjectId;
    chainCastId: Types.ObjectId;
    userId: Types.ObjectId;
    emoji: string;
    timestamp: Date;
    isActive: boolean;
    createdAt: Date;
}

const ChainCastReactionSchema: Schema<IChainCastReaction> = new Schema({
    chainCastId: { type: Schema.Types.ObjectId, ref: 'ChainCast', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { 
        type: String, 
        required: true,
        enum: ['👏', '❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯'],
        maxlength: 10
    },
    timestamp: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for efficient queries
ChainCastReactionSchema.index({ chainCastId: 1, timestamp: -1 });
ChainCastReactionSchema.index({ userId: 1, createdAt: -1 });
ChainCastReactionSchema.index({ chainCastId: 1, emoji: 1 });

export const ChainCastReactionModel: Model<IChainCastReaction> = mongoose.model<IChainCastReaction>('ChainCastReaction', ChainCastReactionSchema);
export default ChainCastReactionModel;