import { injectable } from "inversify";
import { OtpModel } from "../models/otp.model";
import { Types } from "mongoose";
import { IOTP } from "../models/otp.model"; 
import logger from "../utils/logger";
import { IOtpRepository } from "../core/interfaces/repositories/IOTP.repository";

@injectable()
export class OtpRepository implements IOtpRepository {
  async saveOtp(email: string, otp: string, expiresAt: Date): Promise<IOTP> {
    try {
      // Delete  existing OTP for this email first
      await OtpModel.deleteMany({ email }).exec();
      
      // Create new OTP record
      const otpRecord = await OtpModel.create({ 
        email: email.toLowerCase().trim(), 
        otp, 
        expiresAt 
      });
      
      logger.info(`OTP saved for email: ${email}`);
      return otpRecord;
    } catch (error) {
      logger.error("Error saving OTP:", error);
      throw new Error("Failed to save OTP");
    }
  }

  async findOtpByEmail(email: string): Promise<IOTP | null> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const record = await OtpModel.findOne({ email: cleanEmail })
        .sort({ createdAt: -1 })
        .exec();
      
      logger.info(`Finding OTP for email: ${cleanEmail}, found: ${record ? 'yes' : 'no'}`);
      return record;
    } catch (error) {
      logger.error("Error finding OTP:", error);
      throw new Error("Failed to find OTP");
    }
  }

  async deleteOtp(id: string): Promise<IOTP | null> {
    try {
      // Try to delete by ID first, if that fails, try by email
      let result = null;
      
      if (Types.ObjectId.isValid(id)) {
        result = await OtpModel.findByIdAndDelete(id).exec();
      } else {
        // Assume it's an email
        result = await OtpModel.findOneAndDelete({ email: id.toLowerCase().trim() }).exec();
      }
      
      logger.info(`OTP deleted for: ${id}`);
      return result;
    } catch (error) {
      logger.error("Error deleting OTP:", error);
      throw new Error("Failed to delete OTP");
    }
  }
}