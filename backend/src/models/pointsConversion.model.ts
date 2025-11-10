import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPointsConversion extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  pointsConverted: number;
  cvcAmount: number;
  conversionRate: number; // Points per CVC at time of conversion
  status: 'pending' | 'approved' | 'rejected' | 'claimed';
  transactionHash?: string;
  claimFee: number; // Fee paid in ETH
  walletAddress?: string;
  adminNote?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PointsConversionSchema: Schema<IPointsConversion> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pointsConverted: { type: Number, required: true, min: 1 },
  cvcAmount: { type: Number, required: true, min: 0.01 },
  conversionRate: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'claimed'], 
    default: 'pending' 
  },
  transactionHash: { type: String, sparse: true },
  claimFee: { type: Number, default: 0.001 },
  walletAddress: { type: String, required: false },
  adminNote: { type: String, required: false },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
  approvedAt: { type: Date, required: false },
  claimedAt: { type: Date, required: false }
}, {
  timestamps: true
});

// Indexes
PointsConversionSchema.index({ userId: 1, createdAt: -1 });
PointsConversionSchema.index({ status: 1, createdAt: -1 });
PointsConversionSchema.index({ transactionHash: 1 }, { sparse: true });

export const PointsConversionModel = mongoose.model<IPointsConversion>('PointsConversion', PointsConversionSchema);