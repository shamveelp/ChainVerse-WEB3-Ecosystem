import { OtpModel } from "../models/otp.model";
import { Types } from "mongoose";
import { IOTP } from "../models/otp.model"; 

export class OtpRepository {
  async saveOtp(email: string, otp: string, expiresAt: Date): Promise<IOTP> {
    return await OtpModel.create({ email, otp, expiresAt });
  }

  async findOtpByEmail(email: string): Promise<IOTP | null> {
    return await OtpModel.findOne({ email }).sort({ createdAt: -1 }).exec();
  }

 async deleteOtp(email: string): Promise<IOTP | null> {
  return await OtpModel.findOneAndDelete({ email }).exec();
}
}
