import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPointsHistory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  type: 'daily_checkin' | 'referral_bonus' | 'quest_reward' | 'bonus' | 'deduction';
  points: number;
  description: string;
  relatedId?: Types.ObjectId; // For referencing related documents (referral, quest, etc.)
  createdAt: Date;
}

const PointsHistorySchema: Schema<IPointsHistory> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['daily_checkin', 'referral_bonus', 'quest_reward', 'bonus', 'deduction'], 
    required: true 
  },
  points: { type: Number, required: true },
  description: { type: String, required: true },
  relatedId: { type: Schema.Types.ObjectId, required: false },
}, {
  timestamps: true
});

// Create indexes for better query performance
PointsHistorySchema.index({ userId: 1, createdAt: -1 });
PointsHistorySchema.index({ type: 1 });

export const PointsHistoryModel = mongoose.model<IPointsHistory>('PointsHistory', PointsHistorySchema);