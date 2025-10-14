import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityMember extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    userId: Types.ObjectId;
    joinedAt: Date;
    role: 'member' | 'moderator' | 'vip';
    status: 'active' | 'inactive' | 'banned';
    isPremium: boolean;
    lastActive: Date;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityMemberSchema: Schema<ICommunityMember> = new Schema({
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'moderator', 'vip'], default: 'member' },
    status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
    isPremium: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
}, {
    timestamps: true
});

// Compound index for community and user
CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ communityId: 1, status: 1 });
CommunityMemberSchema.index({ communityId: 1, lastActive: -1 });

export const CommunityMemberModel: Model<ICommunityMember> = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);
export default CommunityMemberModel;