import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChainCastParticipant extends Document {
    _id: Types.ObjectId;
    chainCastId: Types.ObjectId;
    userId: Types.ObjectId;
    role: 'viewer' | 'moderator' | 'admin';
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
    permissions: {
        canStream: boolean;
        canModerate: boolean;
        canReact: boolean;
        canChat: boolean;
    };
    streamData: {
        hasVideo: boolean;
        hasAudio: boolean;
        isMuted: boolean;
        isVideoOff: boolean;
    };
    connectionInfo: {
        socketId?: string;
        userAgent?: string;
        ipAddress?: string;
        quality?: 'low' | 'medium' | 'high';
    };
    watchTime: number; // in seconds
    reactionsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ChainCastParticipantSchema: Schema<IChainCastParticipant> = new Schema({
    chainCastId: { type: Schema.Types.ObjectId, ref: 'ChainCast', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
        type: String, 
        enum: ['viewer', 'moderator', 'admin'], 
        default: 'viewer' 
    },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: true },
    permissions: {
        canStream: { type: Boolean, default: false },
        canModerate: { type: Boolean, default: false },
        canReact: { type: Boolean, default: true },
        canChat: { type: Boolean, default: true },
    },
    streamData: {
        hasVideo: { type: Boolean, default: false },
        hasAudio: { type: Boolean, default: false },
        isMuted: { type: Boolean, default: false },
        isVideoOff: { type: Boolean, default: true },
    },
    connectionInfo: {
        socketId: { type: String },
        userAgent: { type: String },
        ipAddress: { type: String },
        quality: { 
            type: String, 
            enum: ['low', 'medium', 'high'], 
            default: 'medium' 
        },
    },
    watchTime: { type: Number, default: 0, min: 0 },
    reactionsCount: { type: Number, default: 0, min: 0 },
}, {
    timestamps: true
});

// Indexes for efficient queries
ChainCastParticipantSchema.index({ chainCastId: 1, userId: 1 }, { unique: true });
ChainCastParticipantSchema.index({ chainCastId: 1, isActive: 1 });
ChainCastParticipantSchema.index({ userId: 1, joinedAt: -1 });
ChainCastParticipantSchema.index({ chainCastId: 1, role: 1 });

export const ChainCastParticipantModel: Model<IChainCastParticipant> = mongoose.model<IChainCastParticipant>('ChainCastParticipant', ChainCastParticipantSchema);
export default ChainCastParticipantModel;