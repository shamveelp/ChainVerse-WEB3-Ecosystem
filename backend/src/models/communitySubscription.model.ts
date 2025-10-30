import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunitySubscription extends Document {
  communityId: Types.ObjectId;
  plan: "lifetime";
  status: "active" | "inactive" | "pending" | "failed" | "expired";
  paymentId?: string;
  orderId?: string;
  expiresAt?: Date; // New field for order expiration
  failedAt?: Date; // New field to track failed payment time
  retryCount?: number; // Track retry attempts
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySubscriptionSchema: Schema<ICommunitySubscription> = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, unique: true },
    plan: { type: String, enum: ["lifetime"], default: "lifetime" },
    status: { 
      type: String, 
      enum: ["active", "inactive", "pending", "failed", "expired"], 
      default: "pending" 
    },
    paymentId: { type: String },
    orderId: { type: String },
    expiresAt: { 
      type: Date, 
      default: function() {
        return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      }
    },
    failedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for automatic cleanup of expired orders
CommunitySubscriptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CommunitySubscriptionModel: Model<ICommunitySubscription> = mongoose.model<ICommunitySubscription>(
  "CommunitySubscription",
  CommunitySubscriptionSchema
);
export default CommunitySubscriptionModel;