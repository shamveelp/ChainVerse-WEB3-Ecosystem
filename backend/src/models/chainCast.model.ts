import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChainCast extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    adminId: Types.ObjectId;
    title: string;
    description?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduledStartTime?: Date;
    actualStartTime?: Date;
    endTime?: Date;
    maxParticipants: number;
    currentParticipants: number;
    settings: {
        allowReactions: boolean;
        allowChat: boolean;
        moderationRequired: boolean;
        recordSession: boolean;
    };
    streamData: {
        streamKey?: string;
        streamUrl?: string;
        recordingUrl?: string;
    };
    stats: {
        totalViews: number;
        peakViewers: number;
        totalReactions: number;
        averageWatchTime: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChainCastSchema: Schema<IChainCast> = new Schema({
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin', required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    status: { 
        type: String, 
        enum: ['scheduled', 'live', 'ended', 'cancelled'], 
        default: 'scheduled' 
    },
    scheduledStartTime: { type: Date },
    actualStartTime: { type: Date },
    endTime: { type: Date },
    maxParticipants: { type: Number, default: 50, min: 1, max: 100 },
    currentParticipants: { type: Number, default: 0, min: 0 },
    settings: {
        allowReactions: { type: Boolean, default: true },
        allowChat: { type: Boolean, default: true },
        moderationRequired: { type: Boolean, default: true },
        recordSession: { type: Boolean, default: false },
    },
    streamData: {
        streamKey: { type: String },
        streamUrl: { type: String },
        recordingUrl: { type: String },
    },
    stats: {
        totalViews: { type: Number, default: 0 },
        peakViewers: { type: Number, default: 0 },
        totalReactions: { type: Number, default: 0 },
        averageWatchTime: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Indexes for efficient queries
ChainCastSchema.index({ communityId: 1, status: 1 });
ChainCastSchema.index({ adminId: 1, createdAt: -1 });
ChainCastSchema.index({ status: 1, scheduledStartTime: 1 });
ChainCastSchema.index({ communityId: 1, createdAt: -1 });

export const ChainCastModel: Model<IChainCast> = mongoose.model<IChainCast>('ChainCast', ChainCastSchema);
export default ChainCastModel;