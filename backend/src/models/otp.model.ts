import mongoose, { Schema, Document, Model } from "mongoose";


export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId; 
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}


const otpSchema: Schema<IOTP> = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);


export const OtpModel: Model<IOTP> = mongoose.model<IOTP>("Otp", otpSchema);
