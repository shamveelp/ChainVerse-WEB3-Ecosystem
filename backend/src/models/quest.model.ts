import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuest extends Document {
  _id: Types.ObjectId;
  communityId: Types.ObjectId;
  createdBy: Types.ObjectId; // Community admin who created this quest
  
  // Basic Quest Info
  title: string;
  description: string;
  bannerImage: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Timing
  startDate: Date;
  endDate: Date;
  
  // Participation
  selectionMethod: 'fcfs' | 'random'; // First Come First Serve or Random Pick
  participantLimit: number; // Number of winners
  maxParticipants?: number; // Optional max participants
  
  // Rewards
  rewardPool: {
    type: 'token' | 'nft' | 'points' | 'custom';
    amount: number;
    tokenSymbol?: string;
    nftCollection?: string;
    customDescription?: string;
  };
  
  // Status
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  
  // Tasks
  tasks: Types.ObjectId[]; // References to QuestTask
  
  // Participants tracking
  totalParticipants: number;
  totalWinners: number;
  
  // AI Generation metadata
  aiGenerated: boolean;
  aiPrompt?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema: Schema<IQuest> = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin', required: true },
  
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  bannerImage: { type: String, required: true },
  category: { type: String, required: true, maxlength: 50 },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  selectionMethod: { type: String, enum: ['fcfs', 'random'], required: true },
  participantLimit: { type: Number, required: true, min: 1 },
  maxParticipants: { type: Number, min: 1 },
  
  rewardPool: {
    type: { type: String, enum: ['token', 'nft', 'points', 'custom'], required: true },
    amount: { type: Number, required: true, min: 0 },
    tokenSymbol: { type: String, maxlength: 20 },
    nftCollection: { type: String, maxlength: 100 },
    customDescription: { type: String, maxlength: 200 }
  },
  
  status: { type: String, enum: ['draft', 'active', 'ended', 'cancelled'], default: 'draft' },
  
  tasks: [{ type: Schema.Types.ObjectId, ref: 'QuestTask' }],
  
  totalParticipants: { type: Number, default: 0 },
  totalWinners: { type: Number, default: 0 },
  
  aiGenerated: { type: Boolean, default: false },
  aiPrompt: { type: String, maxlength: 1000 }
}, {
  timestamps: true
});

// Indexes
QuestSchema.index({ communityId: 1, status: 1 });
QuestSchema.index({ startDate: 1, endDate: 1 });
QuestSchema.index({ createdAt: -1 });

export const QuestModel: Model<IQuest> = mongoose.model<IQuest>('Quest', QuestSchema);
export default QuestModel;