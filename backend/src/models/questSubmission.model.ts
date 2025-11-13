import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestSubmission extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  taskId: Types.ObjectId;
  participantId: Types.ObjectId;
  userId: Types.ObjectId;
  
  // Submission Data
  submissionType: 'screenshot' | 'text' | 'link' | 'wallet' | 'auto';
  submissionData: {
    text?: string;
    imageUrl?: string;
    link?: string;
    walletAddress?: string;
    transactionHash?: string;
    metadata?: any;
  };
  
  // Verification
  status: 'pending' | 'approved' | 'rejected' | 'auto_verified';
  verifiedBy?: Types.ObjectId; // Community admin who verified
  verificationNote?: string;
  verifiedAt?: Date;
  
  // Points
  pointsAwarded: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const QuestSubmissionSchema: Schema<IQuestSubmission> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'QuestTask', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'QuestParticipant', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  submissionType: { type: String, enum: ['screenshot', 'text', 'link', 'wallet', 'auto'], required: true },
  submissionData: {
    text: { type: String, maxlength: 1000 },
    imageUrl: { type: String, maxlength: 500 },
    link: { type: String, maxlength: 500 },
    walletAddress: { type: String, maxlength: 42 },
    transactionHash: { type: String, maxlength: 66 },
    metadata: { type: Schema.Types.Mixed }
  },
  
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'auto_verified'], default: 'pending' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin' },
  verificationNote: { type: String, maxlength: 500 },
  verifiedAt: { type: Date },
  
  pointsAwarded: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

// Indexes
QuestSubmissionSchema.index({ questId: 1, status: 1 });
QuestSubmissionSchema.index({ participantId: 1, taskId: 1 });
QuestSubmissionSchema.index({ createdAt: -1 });

export const QuestSubmissionModel: Model<IQuestSubmission> = mongoose.model<IQuestSubmission>('QuestSubmission', QuestSubmissionSchema);
export default QuestSubmissionModel;