import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityMember extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    userId: Types.ObjectId;
    joinedAt: Date;
    role: 'member' | 'moderator' | 'admin';
    isActive: boolean;
    lastActiveAt: Date;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
    isPremium: boolean;
    premiumExpiresAt?: Date;
    bannedUntil?: Date;
    bannedBy?: Types.ObjectId;
    banReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityMemberSchema: Schema<ICommunityMember> = new Schema({
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    bannedUntil: { type: Date },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin' },
    banReason: { type: String },
}, {
    timestamps: true
});

// Compound indexes for efficient queries
CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ communityId: 1, isActive: 1 });
CommunityMemberSchema.index({ communityId: 1, joinedAt: -1 });
CommunityMemberSchema.index({ communityId: 1, lastActiveAt: -1 });

export const CommunityMemberModel: Model<ICommunityMember> = mongoose.model<ICommunityMember>('CommunityMember', CommunityMemberSchema);
export default CommunityMemberModel;