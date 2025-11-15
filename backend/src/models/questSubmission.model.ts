import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuestSubmission extends Document {
  _id: Types.ObjectId;
  questId: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  submissionData: {
    text?: string;
    imageUrl?: string;
    linkUrl?: string;
    twitterUrl?: string;
    walletAddress?: string;
    transactionHash?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'auto_verified';
  reviewedBy?: Types.ObjectId; // Community admin who reviewed
  reviewComment?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestSubmissionSchema: Schema<IQuestSubmission> = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'QuestTask', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submissionData: {
    text: { type: String },
    imageUrl: { type: String },
    linkUrl: { type: String },
    twitterUrl: { type: String },
    walletAddress: { type: String },
    transactionHash: { type: String }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'auto_verified'], 
    default: 'pending' 
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'CommunityAdmin' },
  reviewComment: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
}, {
  timestamps: true
});

// Compound indexes
QuestSubmissionSchema.index({ questId: 1, taskId: 1, userId: 1 }, { unique: true });
QuestSubmissionSchema.index({ questId: 1, status: 1 });
QuestSubmissionSchema.index({ userId: 1, status: 1 });

export const QuestSubmissionModel: Model<IQuestSubmission> = mongoose.model<IQuestSubmission>('QuestSubmission', QuestSubmissionSchema);
export default QuestSubmissionModel;