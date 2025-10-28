import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChainCastModerationRequest extends Document {
    _id: Types.ObjectId;
    chainCastId: Types.ObjectId;
    userId: Types.ObjectId;
    requestedPermissions: {
        video: boolean;
        audio: boolean;
    };
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    reviewMessage?: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChainCastModerationRequestSchema: Schema<IChainCastModerationRequest> = new Schema({
    chainCastId: { type: Schema.Types.ObjectId, ref: 'ChainCast', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedPermissions: {
        video: { type: Boolean, default: false },
        audio: { type: Boolean, default: false },
    },
    message: { type: String, maxlength: 200 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin' },
    reviewedAt: { type: Date },
    reviewMessage: { type: String, maxlength: 200 },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Indexes for efficient queries
ChainCastModerationRequestSchema.index({ chainCastId: 1, status: 1 });
ChainCastModerationRequestSchema.index({ userId: 1, status: 1 });
ChainCastModerationRequestSchema.index({ chainCastId: 1, userId: 1, status: 1 });
ChainCastModerationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ChainCastModerationRequestModel: Model<IChainCastModerationRequest> = mongoose.model<IChainCastModerationRequest>('ChainCastModerationRequest', ChainCastModerationRequestSchema);
export default ChainCastModerationRequestModel;