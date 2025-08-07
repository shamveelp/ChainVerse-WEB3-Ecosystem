import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { StatusCode } from "../../enums/statusCode.enum";
import { ICommunityAdminAuthController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminAuth.controller";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequestRepository";
import dotenv from 'dotenv';

dotenv.config();

@injectable()
export class CommunityAdminAuthController implements ICommunityAdminAuthController {
    constructor(
        @inject(TYPES.ICommunityAdminAuthService) private commAdminAuthService: ICommunityAdminAuthService,
        @inject(TYPES.IJwtService) private jwtService: IJwtService,
        @inject(TYPES.IOtpService) private otpService: IOTPService,
        @inject(TYPES.ICommunityAdminRepository) private commAdminRepo: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRequestRepository) private communityRequestRepo: ICommunityRequestRepository
    ) {}

    async createCommunity(req: Request, res: Response): Promise<void> {
        try {
            const {
                communityName,
                email,
                username,
                walletAddress,
                description,
                category,
                whyChooseUs,
                rules,
                socialLinks,
                logo,
                banner
            } = req.body;

            // Check if email already has a request
            const existingRequest = await this.communityRequestRepo.findByEmail(email);
            if (existingRequest) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    message: "Application already exists for this email"
                });
                return;
            }

            // Create community request
            const communityRequest = await this.communityRequestRepo.create({
                communityName,
                email,
                username,
                walletAddress,
                description,
                category,
                whyChooseUs,
                rules,
                socialLinks,
                logo,
                banner,
                status: 'pending'
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                message: "Community application submitted successfully",
                requestId: communityRequest._id
            });

            logger.info(`Community application created for email: ${email}`);
        } catch (error: any) {
            logger.error("Create community error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "Failed to submit application"
            });
        }
    }

    async setPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Check if community request exists and is pending
            const communityRequest = await this.communityRequestRepo.findByEmail(email);
            if (!communityRequest) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    message: "No application found for this email"
                });
                return;
            }

            // Check if community admin already exists
            const existingAdmin = await this.commAdminRepo.findByEmail(email);
            if (existingAdmin) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    message: "Account already exists for this email"
                });
                return;
            }

            // Create community admin account
            await this.commAdminAuthService.registerCommunityAdmin({
                email,
                password,
                name: communityRequest.username,
                role: 'communityAdmin'
            });

            // Generate OTP for verification
            await this.otpService.requestOtp(email, 'communityAdmin');

            res.status(StatusCode.OK).json({
                success: true,
                message: "Password set successfully. OTP sent to your email for verification."
            });

            logger.info(`Password set for community admin: ${email}`);
        } catch (error: any) {
            logger.error("Set password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "Failed to set password"
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email, otp } = req.body;

            const isValid = await this.otpService.verifyOtp(email, otp);
            if (!isValid) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    message: "Invalid or expired OTP"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP verified successfully. Your application is under review."
            });

            logger.info(`OTP verified for community admin: ${email}`);
        } catch (error: any) {
            logger.error("Verify OTP error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "OTP verification failed"
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const communityAdmin = await this.commAdminAuthService.loginCommunityAdmin(email, password);
            
            const accessToken = this.jwtService.generateAccessToken(
                communityAdmin!._id.toString(), 
                'communityAdmin'
            );
            const refreshToken = this.jwtService.generateRefreshToken(
                communityAdmin!._id.toString(), 
                'communityAdmin'
            );

            this.jwtService.setTokens(res, accessToken, refreshToken);

            res.status(StatusCode.OK).json({
                success: true,
                message: "Login successful",
                communityAdmin: {
                    id: communityAdmin!._id,
                    email: communityAdmin!.email,
                    name: communityAdmin!.name,
                    role: communityAdmin!.role,
                    communityId: communityAdmin!.communityId
                }
            });

            logger.info(`Community admin logged in: ${email}`);
        } catch (error: any) {
            logger.error("Community admin login error:", error);
            res.status(StatusCode.UNAUTHORIZED).json({
                success: false,
                message: error.message || "Login failed"
            });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            await this.otpService.requestForgotPasswordOtp(email, 'communityAdmin');

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP sent to your email for password reset"
            });

            logger.info(`Forgot password OTP sent to: ${email}`);
        } catch (error: any) {
            logger.error("Forgot password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "Failed to send OTP"
            });
        }
    }

    async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email, otp } = req.body;

            const isValid = await this.otpService.verifyOtp(email, otp);
            if (!isValid) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    message: "Invalid or expired OTP"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP verified. You can now reset your password."
            });

            logger.info(`Forgot password OTP verified for: ${email}`);
        } catch (error: any) {
            logger.error("Verify forgot password OTP error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "OTP verification failed"
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            await this.commAdminAuthService.resetPassword(email, password);

            res.status(StatusCode.OK).json({
                success: true,
                message: "Password reset successfully"
            });

            logger.info(`Password reset successful for: ${email}`);
        } catch (error: any) {
            logger.error("Reset password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: error.message || "Failed to reset password"
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        this.jwtService.clearTokens(res);
        res.status(StatusCode.OK).json({
            success: true,
            message: "Logged out successfully"
        });
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const communityAdmin = await this.commAdminRepo.findById(communityAdminId);

            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    message: "Community admin not found"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                communityAdmin: {
                    id: communityAdmin._id,
                    email: communityAdmin.email,
                    name: communityAdmin.name,
                    role: communityAdmin.role,
                    communityId: communityAdmin.communityId,
                    isActive: communityAdmin.isActive,
                    lastLogin: communityAdmin.lastLogin
                }
            });
        } catch (error: any) {
            logger.error("Get profile error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to get profile"
            });
        }
    }
}
