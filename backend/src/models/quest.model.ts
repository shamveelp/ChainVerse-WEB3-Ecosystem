import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuest extends Document {
  _id: Types.ObjectId;
  communityId: Types.ObjectId;
  communityAdminId: Types.ObjectId;
  title: string;
  description: string;
  bannerImage: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: 'fcfs' | 'random';
  participantLimit: number; // Number of winners
  rewardPool: {
    amount: number;
    currency: string; // 'USD', 'ETH', 'POINTS', etc.
    rewardType: 'token' | 'nft' | 'points' | 'custom';
    customReward?: string;
  };
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  isAIGenerated: boolean;
  aiPrompt?: string;
  totalParticipants: number;
  totalSubmissions: number;
  winnersSelected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema: Schema<IQuest> = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  communityAdminId: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin', required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  bannerImage: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  selectionMethod: { type: String, enum: ['fcfs', 'random'], required: true },
  participantLimit: { type: Number, required: true, min: 1 },
  rewardPool: {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    rewardType: { type: String, enum: ['token', 'nft', 'points', 'custom'], required: true },
    customReward: { type: String }
  },
  status: { type: String, enum: ['draft', 'active', 'ended', 'cancelled'], default: 'draft' },
  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: { type: String },
  totalParticipants: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  winnersSelected: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
QuestSchema.index({ communityId: 1, status: 1 });
QuestSchema.index({ communityAdminId: 1 });
QuestSchema.index({ startDate: 1, endDate: 1 });
QuestSchema.index({ status: 1, endDate: 1 });

export const QuestModel: Model<IQuest> = mongoose.model<IQuest>('Quest', QuestSchema);
export default QuestModel;