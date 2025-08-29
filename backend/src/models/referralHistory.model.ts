import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReferralHistory extends Document {
  _id: mongoose.Types.ObjectId;
  referrer: Types.ObjectId; // User who made the referral
  referred: Types.ObjectId; // User who was referred
  referralCode: string;
  pointsAwarded: number;
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ReferralHistorySchema: Schema<IReferralHistory> = new Schema({
  referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referred: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referralCode: { type: String, required: true },
  pointsAwarded: { type: Number, default: 100 },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
}, {
  timestamps: true
});

// Create indexes for better query performance
ReferralHistorySchema.index({ referrer: 1, createdAt: -1 });
ReferralHistorySchema.index({ referred: 1 });
ReferralHistorySchema.index({ referralCode: 1 });

export const ReferralHistoryModel = mongoose.model<IReferralHistory>('ReferralHistory', ReferralHistorySchema);