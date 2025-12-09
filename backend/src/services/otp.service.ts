import { injectable, inject } from "inversify";
import { IOTPService } from "../core/interfaces/services/IOTP.service";
import { IUserRepository } from "../core/interfaces/repositories/IUser.repository";
import { IOtpRepository } from "../core/interfaces/repositories/IOTP.repository";
import { TYPES } from "../core/types/types";
import { IMailService } from "../core/interfaces/services/IMail.service";
import logger from "../utils/logger";
import { IAdminRepository } from "../core/interfaces/repositories/IAdmin.repository";
import { ICommunityAdminRepository } from "../core/interfaces/repositories/ICommunityAdminRepository";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";

@injectable()
export class OtpService implements IOTPService {
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
        @inject(TYPES.ICommunityAdminRepository) private _communityAdminRepository: ICommunityAdminRepository,
        @inject(TYPES.IOtpRepository) private _otpRepository: IOtpRepository,
        @inject(TYPES.IMailService) private _mailService: IMailService
    ) { }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private getRepoByRole(role: 'user' | 'admin' | 'communityAdmin') {
        switch(role) {
            case 'user':
                return this._userRepository;
            case 'admin':
                return this._adminRepository;
            case 'communityAdmin':
                return this._communityAdminRepository;
            default:
                throw new CustomError("Invalid role", StatusCode.BAD_REQUEST);
        }
    }

    async requestOtp(email: string, role: 'user' | 'admin' | 'communityAdmin'): Promise<string> {
        try {
            const repo = this.getRepoByRole(role);
            
            // For registration OTP, we should NOT check if user exists
            // This is called during registration process before user is created
            
            const otp = this.generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            
            logger.info(`Generated OTP: ${otp} for email: ${email}, role: ${role}`);
            
            // Clear existing OTPs for this email
            await this._otpRepository.deleteOtp(email);
            
            // Save new OTP
            await this._otpRepository.saveOtp(email, otp, expiresAt);
            
            // Send OTP via email
            await this._mailService.sendOtp(email, otp, 'verification');
            
            logger.info(`OTP sent successfully to: ${email}`);
            return otp;
        } catch (error) {
            logger.error("Error requesting OTP:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to send OTP", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async requestForgotPasswordOtp(email: string, role: 'user' | 'admin' | 'communityAdmin'): Promise<string> {
        try {
            const repo = this.getRepoByRole(role);
            
            // For forgot password, user must exist
            const existingUser = await repo.findByEmail(email);
            if (!existingUser) {
                throw new CustomError("No account found with this email address", StatusCode.NOT_FOUND);
            }

            const otp = this.generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            logger.info(`Generated forgot password OTP: ${otp} for email: ${email}`);
            
            // Clear existing OTPs for this email
            await this._otpRepository.deleteOtp(email);
            
            // Save new OTP
            await this._otpRepository.saveOtp(email, otp, expiresAt);
            
            // Send OTP via email
            await this._mailService.sendOtp(email, otp, 'forgotPassword');
            
            logger.info(`Forgot password OTP sent successfully to: ${email}`);
            return otp;
        } catch (error) {
            logger.error("Error requesting forgot password OTP:", error);
            throw error instanceof CustomError ? error : new CustomError("Failed to send password reset code", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        try {
            const record = await this._otpRepository.findOtpByEmail(email);
            
            if (!record) {
                throw new CustomError("No verification code found for this email", StatusCode.NOT_FOUND);
            }
            
            if (record.expiresAt < new Date()) {
                await this._otpRepository.deleteOtp(record._id.toString());
                throw new CustomError("Verification code has expired", StatusCode.BAD_REQUEST);
            }
            
            if (record.otp !== otp) {
                throw new CustomError("Invalid verification code", StatusCode.BAD_REQUEST);
            }

            // Delete the OTP after successful verification
            await this._otpRepository.deleteOtp(record._id.toString());
            
            logger.info(`OTP verified successfully for: ${email}`);
            return true;
        } catch (error) {
            logger.error("Error verifying OTP:", error);
            throw error instanceof CustomError ? error : new CustomError("OTP verification failed", StatusCode.BAD_REQUEST);
        }
    }

    async clearOtp(email: string): Promise<void> {
        try {
            await this._otpRepository.deleteOtp(email);
            logger.info(`OTP cleared for: ${email}`);
        } catch (error) {
            logger.error("Error clearing OTP:", error);
            throw new CustomError("Failed to clear OTP", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}