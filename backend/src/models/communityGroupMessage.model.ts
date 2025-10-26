import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityGroupMessage extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    senderId: Types.ObjectId; // User ID
    content: string;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    readBy: {
        userId: Types.ObjectId;
        readAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const CommunityGroupMessageSchema: Schema<ICommunityGroupMessage> = new Schema({
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    readBy: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Indexes
CommunityGroupMessageSchema.index({ communityId: 1, isDeleted: 1, createdAt: -1 });
CommunityGroupMessageSchema.index({ communityId: 1, senderId: 1 });

export const CommunityGroupMessageModel: Model<ICommunityGroupMessage> = mongoose.model<ICommunityGroupMessage>('CommunityGroupMessage', CommunityGroupMessageSchema);
export default CommunityGroupMessageModel;
