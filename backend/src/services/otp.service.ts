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
import { ErrorMessages, LoggerMessages, SuccessMessages } from "../enums/messages.enum";

@injectable()
export class OtpService implements IOTPService {
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
        @inject(TYPES.ICommunityAdminRepository) private _communityAdminRepository: ICommunityAdminRepository,
        @inject(TYPES.IOtpRepository) private _otpRepository: IOtpRepository,
        @inject(TYPES.IMailService) private _mailService: IMailService
    ) { }

    /**
     * Generates a 6-digit random OTP.
     * @returns {string} The generated OTP.
     */
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Retrieves the appropriate repository based on the user role.
     * @param {string} role - The role of the user ('user' | 'admin' | 'communityAdmin').
     * @returns {IUserRepository | IAdminRepository | ICommunityAdminRepository} The corresponding repository.
     * @throws {CustomError} If the role is invalid.
     */
    private getRepoByRole(role: 'user' | 'admin' | 'communityAdmin') {
        switch (role) {
            case 'user':
                return this._userRepository;
            case 'admin':
                return this._adminRepository;
            case 'communityAdmin':
                return this._communityAdminRepository;
            default:
                throw new CustomError(ErrorMessages.INVALID_ROLE, StatusCode.BAD_REQUEST);
        }
    }

    /**
     * Requests an OTP for a specific purpose (e.g., verification).
     * @param {string} email - The email address to send the OTP to.
     * @param {string} role - The role of the user requesting the OTP.
     * @returns {Promise<string>} The generated OTP.
     * @throws {CustomError} If sending the OTP fails.
     */
    async requestOtp(email: string, role: 'user' | 'admin' | 'communityAdmin'): Promise<string> {
        try {
            this.getRepoByRole(role);

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

            logger.info(`${SuccessMessages.OTP_SENT}: ${email}`);
            return otp;
        } catch (error) {
            logger.error(LoggerMessages.REQUEST_OTP_ERROR, error);
            throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_RESEND_OTP, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Requests an OTP for password recovery.
     * @param {string} email - The email address to send the OTP to.
     * @param {string} role - The role of the user requesting the password reset.
     * @returns {Promise<string>} The generated OTP.
     * @throws {CustomError} If the user is not found or sending the OTP fails.
     */
    async requestForgotPasswordOtp(email: string, role: 'user' | 'admin' | 'communityAdmin'): Promise<string> {
        try {
            const repo = this.getRepoByRole(role);

            // For forgot password, user must exist
            const existingUser = await repo.findByEmail(email);
            if (!existingUser) {
                throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
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

            logger.info(`${SuccessMessages.PASSWORD_RESET_OTP_SENT}: ${email}`);
            return otp;
        } catch (error) {
            logger.error(LoggerMessages.FORGOT_PASSWORD_OTP_ERROR, error);
            throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_RESET_CODE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Verifies if the provided OTP is valid for the given email.
     * @param {string} email - The email address to verify.
     * @param {string} otp - The OTP to verify.
     * @returns {Promise<boolean>} True if the OTP is valid.
     * @throws {CustomError} If the OTP is invalid, expired, or not found.
     */
    async verifyOtp(email: string, otp: string): Promise<boolean> {
        try {
            const record = await this._otpRepository.findOtpByEmail(email);

            if (!record) {
                throw new CustomError(ErrorMessages.INVALID_OTP, StatusCode.NOT_FOUND);
            }

            if (record.expiresAt < new Date()) {
                await this._otpRepository.deleteOtp(record._id.toString());
                throw new CustomError(ErrorMessages.INVALID_OTP, StatusCode.BAD_REQUEST);
            }

            if (record.otp !== otp) {
                throw new CustomError(ErrorMessages.INVALID_OTP, StatusCode.BAD_REQUEST);
            }

            // Delete the OTP after successful verification
            await this._otpRepository.deleteOtp(record._id.toString());

            logger.info(`${SuccessMessages.OTP_VERIFIED}: ${email}`);
            return true;
        } catch (error) {
            logger.error(LoggerMessages.VERIFY_OTP_ERROR, error);
            throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_OTP_VERIFICATION, StatusCode.BAD_REQUEST);
        }
    }

    /**
     * Clears any existing OTP for the given email.
     * @param {string} email - The email address to clear the OTP for.
     * @returns {Promise<void>}
     * @throws {CustomError} If clearing the OTP fails.
     */
    async clearOtp(email: string): Promise<void> {
        try {
            await this._otpRepository.deleteOtp(email);
            logger.info(`OTP cleared for: ${email}`);
        } catch (error) {
            logger.error(LoggerMessages.CLEAR_OTP_ERROR, error);
            throw new CustomError(ErrorMessages.FAILED_RESEND_OTP, StatusCode.INTERNAL_SERVER_ERROR); // Reusing FAILED_RESEND_OTP as generic OTP error or similar
        }
    }
}