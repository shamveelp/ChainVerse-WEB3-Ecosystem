import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunitySubscription extends Document {
  communityId: Types.ObjectId;
  plan: "lifetime";
  status: "active" | "inactive" | "pending";
  paymentId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySubscriptionSchema: Schema<ICommunitySubscription> = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, unique: true },
    plan: { type: String, enum: ["lifetime"], default: "lifetime" },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "pending" },
    paymentId: { type: String },
    orderId: { type: String },
  },
  { timestamps: true }
);

export const CommunitySubscriptionModel: Model<ICommunitySubscription> = mongoose.model<ICommunitySubscription>(
  "CommunitySubscription",
  CommunitySubscriptionSchema
);
export default CommunitySubscriptionModel;