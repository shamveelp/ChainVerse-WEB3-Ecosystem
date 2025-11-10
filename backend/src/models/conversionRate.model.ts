import mongoose, { Schema, Document } from "mongoose";

export interface IConversionRate extends Document {
  _id: mongoose.Types.ObjectId;
  pointsPerCVC: number;
  minimumPoints: number;
  minimumCVC: number;
  claimFeeETH: string;
  isActive: boolean;
  effectiveFrom: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionRateSchema: Schema<IConversionRate> = new Schema({
  pointsPerCVC: { type: Number, required: true, min: 1 },
  minimumPoints: { type: Number, required: true, min: 1 },
  minimumCVC: { type: Number, required: true, min: 0.01 },
  claimFeeETH: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
  timestamps: true
});

// Index
ConversionRateSchema.index({ isActive: 1, effectiveFrom: -1 });

export const ConversionRateModel = mongoose.model<IConversionRate>('ConversionRate', ConversionRateSchema);