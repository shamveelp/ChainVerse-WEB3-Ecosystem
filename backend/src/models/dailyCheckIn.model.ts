import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDailyCheckIn extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  checkInDate: Date;
  pointsAwarded: number;
  streakCount: number;
  createdAt: Date;
}

const DailyCheckInSchema: Schema<IDailyCheckIn> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checkInDate: { type: Date, required: true },
  pointsAwarded: { type: Number, default: 10 },
  streakCount: { type: Number, default: 1 },
}, {
  timestamps: true
});

// Create compound index to ensure one check-in per user per day
DailyCheckInSchema.index({ userId: 1, checkInDate: 1 }, { unique: true });
DailyCheckInSchema.index({ userId: 1, createdAt: -1 });

export const DailyCheckInModel = mongoose.model<IDailyCheckIn>('DailyCheckIn', DailyCheckInSchema);