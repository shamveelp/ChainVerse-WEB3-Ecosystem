import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityMessage extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    adminId: Types.ObjectId; // CommunityAdmin ID
    content: string;
    mediaFiles: {
        type: 'image' | 'video';
        url: string;
        publicId: string;
        filename: string;
        size: number;
    }[];
    messageType: 'text' | 'media' | 'mixed';
    isPinned: boolean;
    reactions: {
        emoji: string;
        users: Types.ObjectId[];
        count: number;
    }[];
    totalReactions: number;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityMessageSchema: Schema<ICommunityMessage> = new Schema({
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin', required: true },
    content: { type: String, required: true },
    mediaFiles: [{
        type: { type: String, enum: ['image', 'video'], required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        filename: { type: String, required: true },
        size: { type: Number, required: true }
    }],
    messageType: { 
        type: String, 
        enum: ['text', 'media', 'mixed'], 
        default: 'text' 
    },
    isPinned: { type: Boolean, default: false },
    reactions: [{
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        count: { type: Number, default: 0 }
    }],
    totalReactions: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes
CommunityMessageSchema.index({ communityId: 1, createdAt: -1 });
CommunityMessageSchema.index({ communityId: 1, isPinned: -1, createdAt: -1 });

export const CommunityMessageModel: Model<ICommunityMessage> = mongoose.model<ICommunityMessage>('CommunityMessage', CommunityMessageSchema);
export default CommunityMessageModel;
