import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestParticipant extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  userId: Types.ObjectId;
  communityId: Types.ObjectId;
  
  // Participation Info
  joinedAt: Date;
  walletAddress?: string;
  
  // Progress Tracking
  completedTasks: Types.ObjectId[]; // Array of completed QuestTask IDs
  totalPoints: number;
  completionPercentage: number;
  
  // Submission Status
  status: 'participating' | 'completed' | 'winner' | 'disqualified';
  submittedAt?: Date;
  
  // Winner Selection
  isWinner: boolean;
  winnerRank?: number; // 1, 2, 3... for ranking
  selectedAt?: Date;
  
  // Reward Status
  rewardClaimed: boolean;
  rewardClaimedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const QuestParticipantSchema: Schema<IQuestParticipant> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  
  joinedAt: { type: Date, default: Date.now },
  walletAddress: { type: String, maxlength: 42 },
  
  completedTasks: [{ type: Schema.Types.ObjectId, ref: 'QuestTask' }],
  totalPoints: { type: Number, default: 0, min: 0 },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  
  status: { type: String, enum: ['participating', 'completed', 'winner', 'disqualified'], default: 'participating' },
  submittedAt: { type: Date },
  
  isWinner: { type: Boolean, default: false },
  winnerRank: { type: Number, min: 1 },
  selectedAt: { type: Date },
  
  rewardClaimed: { type: Boolean, default: false },
  rewardClaimedAt: { type: Date }
}, {
  timestamps: true
});

// Compound unique index
QuestParticipantSchema.index({ questId: 1, userId: 1 }, { unique: true });
QuestParticipantSchema.index({ questId: 1, status: 1 });
QuestParticipantSchema.index({ questId: 1, isWinner: 1 });
QuestParticipantSchema.index({ questId: 1, completionPercentage: -1 });

export const QuestParticipantModel: Model<IQuestParticipant> = mongoose.model<IQuestParticipant>('QuestParticipant', QuestParticipantSchema);
export default QuestParticipantModel;