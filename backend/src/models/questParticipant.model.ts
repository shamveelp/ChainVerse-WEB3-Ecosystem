import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestParticipant extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  userId: Types.ObjectId;
  walletAddress?: string;
  status: 'registered' | 'in_progress' | 'completed' | 'winner' | 'disqualified';
  joinedAt: Date;
  completedAt?: Date;
  completedTasks: Types.ObjectId[]; // Array of completed task IDs
  totalTasksCompleted: number;
  totalPrivilegePoints: number; // New field for leaderboard scoring
  isWinner: boolean;
  rewardClaimed: boolean;
  rewardClaimedAt?: Date;
  disqualificationReason?: string;
  disqualifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestParticipantSchema: Schema<IQuestParticipant> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  walletAddress: { type: String },
  status: { 
    type: String, 
    enum: ['registered', 'in_progress', 'completed', 'winner', 'disqualified'], 
    default: 'registered' 
  },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  completedTasks: [{ type: Schema.Types.ObjectId, ref: 'QuestTask' }],
  totalTasksCompleted: { type: Number, default: 0 },
  totalPrivilegePoints: { type: Number, default: 0 }, // New field
  isWinner: { type: Boolean, default: false },
  rewardClaimed: { type: Boolean, default: false },
  rewardClaimedAt: { type: Date },
  disqualificationReason: { type: String },
  disqualifiedAt: { type: Date }
}, {
  timestamps: true
});

// Compound indexes
QuestParticipantSchema.index({ questId: 1, userId: 1 }, { unique: true });
QuestParticipantSchema.index({ questId: 1, status: 1 });
QuestParticipantSchema.index({ questId: 1, isWinner: 1 });
QuestParticipantSchema.index({ questId: 1, completedAt: 1 });
QuestParticipantSchema.index({ questId: 1, totalPrivilegePoints: -1 }); // For leaderboard

export const QuestParticipantModel: Model<IQuestParticipant> = mongoose.model<IQuestParticipant>('QuestParticipant', QuestParticipantSchema);
export default QuestParticipantModel;