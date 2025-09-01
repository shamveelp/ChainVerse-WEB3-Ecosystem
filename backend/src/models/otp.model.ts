import { Schema, model, Document } from "mongoose";

export interface IOTP extends Document {
  _id: Schema.Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one OTP per email at a time
otpSchema.index({ email: 1 }, { unique: true });

export const OtpModel = model<IOTP>("Otp", otpSchema);