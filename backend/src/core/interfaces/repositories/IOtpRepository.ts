import { Types } from "mongoose";
import { IOTP } from "../../../models/otp.model"; 

export interface IOtpRepository {
  saveOtp(email: string, otp: string, expiresAt: Date): Promise<IOTP>;
  findOtpByEmail(email: string): Promise<IOTP | null>;
  deleteOtp(id: Types.ObjectId): Promise<IOTP | null>;
}

