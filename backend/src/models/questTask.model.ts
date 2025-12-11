import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestTask extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  title: string;
  description: string;
  taskType: 'join_community' | 'follow_user' | 'twitter_post' | 'upload_screenshot' | 'nft_mint' | 'token_hold' | 'wallet_connect' | 'custom';
  isRequired: boolean;
  order: number;
  privilegePoints: number; // New field for leaderboard scoring
  config: {
    // For follow_user tasks
    targetUserId?: Types.ObjectId;
    targetUsername?: string;
    communityId?: Types.ObjectId;

    // For twitter_post tasks
    twitterText?: string;
    twitterHashtags?: string[];

    // For nft_mint tasks
    contractAddress?: string;
    tokenId?: string;

    // For token_hold tasks
    tokenAddress?: string;
    minimumAmount?: number;

    // For custom tasks
    customInstructions?: string;
    requiresProof?: boolean;
    proofType?: 'text' | 'image' | 'link';
  };
  completedBy: number; // Count of users who completed this task
  createdAt: Date;
  updatedAt: Date;
}

const QuestTaskSchema: Schema<IQuestTask> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  taskType: {
    type: String,
    enum: ['join_community', 'follow_user', 'twitter_post', 'upload_screenshot', 'nft_mint', 'token_hold', 'wallet_connect', 'custom'],
    required: true
  },
  isRequired: { type: Boolean, default: true },
  order: { type: Number, required: true },
  privilegePoints: { type: Number, default: 1, min: 1, max: 10 }, // New field for scoring
  config: {
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetUsername: { type: String },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    twitterText: { type: String },
    twitterHashtags: [{ type: String }],
    contractAddress: { type: String },
    tokenId: { type: String },
    tokenAddress: { type: String },
    minimumAmount: { type: Number },
    customInstructions: { type: String },
    requiresProof: { type: Boolean, default: false },
    proofType: { type: String, enum: ['text', 'image', 'link'] }
  },
  completedBy: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
QuestTaskSchema.index({ questId: 1, order: 1 });
QuestTaskSchema.index({ questId: 1, privilegePoints: -1 });

export const QuestTaskModel: Model<IQuestTask> = mongoose.model<IQuestTask>('QuestTask', QuestTaskSchema);
export default QuestTaskModel;