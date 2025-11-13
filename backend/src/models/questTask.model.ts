import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestTask extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  
  // Task Info
  title: string;
  description: string;
  type: 'join_community' | 'follow_admin' | 'follow_user' | 'social_post' | 'nft_hold' | 'token_hold' | 'wallet_connect' | 'custom';
  order: number; // Display order
  
  // Task Requirements
  requirements: {
    // For follow tasks
    targetUserId?: Types.ObjectId;
    targetUsername?: string;
    
    // For social tasks
    platform?: 'twitter' | 'instagram' | 'telegram' | 'discord';
    postContent?: string;
    hashtags?: string[];
    requireScreenshot?: boolean;
    
    // For NFT/Token tasks
    contractAddress?: string;
    tokenSymbol?: string;
    minAmount?: number;
    
    // For custom tasks
    customInstructions?: string;
    requiresManualVerification?: boolean;
  };
  
  // Verification
  autoVerify: boolean; // Can be auto-verified or needs manual check
  points: number; // Points awarded for completing this task
  
  createdAt: Date;
  updatedAt: Date;
}

const QuestTaskSchema: Schema<IQuestTask> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  type: { 
    type: String, 
    enum: ['join_community', 'follow_admin', 'follow_user', 'social_post', 'nft_hold', 'token_hold', 'wallet_connect', 'custom'], 
    required: true 
  },
  order: { type: Number, required: true, min: 0 },
  
  requirements: {
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetUsername: { type: String, maxlength: 50 },
    
    platform: { type: String, enum: ['twitter', 'instagram', 'telegram', 'discord'] },
    postContent: { type: String, maxlength: 500 },
    hashtags: [{ type: String, maxlength: 50 }],
    requireScreenshot: { type: Boolean, default: false },
    
    contractAddress: { type: String, maxlength: 42 },
    tokenSymbol: { type: String, maxlength: 20 },
    minAmount: { type: Number, min: 0 },
    
    customInstructions: { type: String, maxlength: 1000 },
    requiresManualVerification: { type: Boolean, default: false }
  },
  
  autoVerify: { type: Boolean, default: false },
  points: { type: Number, default: 10, min: 0 }
}, {
  timestamps: true
});

// Indexes
QuestTaskSchema.index({ questId: 1, order: 1 });

export const QuestTaskModel: Model<IQuestTask> = mongoose.model<IQuestTask>('QuestTask', QuestTaskSchema);
export default QuestTaskModel;