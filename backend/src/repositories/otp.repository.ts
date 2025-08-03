import { OtpModel } from "../models/otp.model";
import { Types } from "mongoose";
import { IOTP } from "../models/otp.model";
import { IOtpRepository } from "../core/interfaces/repositories/IOtpRepository";
import { injectable } from "inversify";

@injectable()
export class OtpRepository implements IOtpRepository {

    async saveOtp(email: string, otp: string, expiresAt: Date): Promise<IOTP> {
        const existingOtp = await OtpModel.findOne({email}).exec()
        if(existingOtp) {
            existingOtp.otp = otp
            existingOtp.expiresAt = expiresAt
            existingOtp.updatedAt = new Date()
            return await existingOtp.save()
        } else {
            return await OtpModel.create({ email, otp, expiresAt });
        }
    }

    async findOtpByEmail(email: string): Promise<IOTP | null> {
        return await OtpModel.findOne({ email }).sort({ createdAt: -1 }).exec();
    }

    async deleteOtp(id: Types.ObjectId): Promise<IOTP | null> {
        return await OtpModel.findByIdAndDelete(id).exec();
    }
}

