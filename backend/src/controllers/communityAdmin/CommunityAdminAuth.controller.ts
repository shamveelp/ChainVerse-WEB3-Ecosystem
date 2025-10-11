import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ICommunityAdminAuthController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminAuth.controller";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";
import cloudinary from "../../config/cloudinary";

@injectable()
export class CommunityAdminAuthController implements ICommunityAdminAuthController {
    constructor(
        @inject(TYPES.ICommunityAdminAuthService) private _commAdminAuthService: ICommunityAdminAuthService
    ) {}

    async checkEmailExists(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.query;

            if (!email || typeof email !== 'string') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Email is required"
                });
                return;
            }

            const result = await this._commAdminAuthService.checkEmailExists(email);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            logger.error("Check email exists error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Failed to check email availability"
            });
        }
    }

    async checkUsernameExists(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.query;

            if (!username || typeof username !== 'string') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._commAdminAuthService.checkUsernameExists(username);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            logger.error("Check username exists error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Failed to check username availability"
            });
        }
    }

    async createCommunity(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            let logoUrl = '';
            let bannerUrl = '';

            // Handle file uploads to Cloudinary
            if (files?.logo?.[0]) {
                const logoUpload = await cloudinary.uploader.upload_stream(
                    {
                        folder: "chainverse/community-logos",
                        transformation: [
                            { width: 200, height: 200, crop: "fill" },
                            { quality: "auto", format: "auto" },
                        ],
                    },
                    (error, result) => {
                        if (error) throw error;
                        return result;
                    }
                );

                logoUrl = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "chainverse/community-logos",
                            transformation: [
                                { width: 200, height: 200, crop: "fill" },
                                { quality: "auto", format: "auto" },
                            ],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result?.secure_url || '');
                        }
                    );
                    stream.end(files.logo[0].buffer);
                });
            }

            if (files?.banner?.[0]) {
                bannerUrl = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "chainverse/community-banners",
                            transformation: [
                                { width: 1200, height: 400, crop: "fill" },
                                { quality: "auto", format: "auto" },
                            ],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result?.secure_url || '');
                        }
                    );
                    stream.end(files.banner[0].buffer);
                });
            }

            // Prepare the DTO with uploaded URLs
            const communityData = {
                ...req.body,
                logo: logoUrl,
                banner: bannerUrl,
            };

            const result = await this._commAdminAuthService.createCommunityApplication(communityData);
            res.status(StatusCode.CREATED).json(result);
        } catch (error: any) {
            logger.error("Create community error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to submit application"
            });
        }
    }

    async setPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.setPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Set password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to set password"
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.verifyOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Verify OTP error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "OTP verification failed"
            });
        }
    }

    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.resendOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Resend OTP error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to resend OTP"
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.loginCommunityAdmin(req.body, res);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Community admin login error:", error);
            let statusCode = StatusCode.UNAUTHORIZED;
            let errorMessage = error.message || "Login failed";

            if (error.message?.includes('under review')) {
                statusCode = StatusCode.FORBIDDEN;
            } else if (error.message?.includes('rejected')) {
                statusCode = StatusCode.FORBIDDEN;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.forgotPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Forgot password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to send reset code"
            });
        }
    }

    async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.verifyForgotPasswordOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Verify forgot password OTP error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "OTP verification failed"
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.resetPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Reset password error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to reset password"
            });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.refreshToken(req, res);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Refresh token error:", error);
            res.status(StatusCode.UNAUTHORIZED).json({
                success: false,
                error: "Invalid or expired refresh token"
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.logout(res);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Logout error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Logout failed"
            });
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const result = await this._commAdminAuthService.getProfile(communityAdminId);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Get profile error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Failed to get profile"
            });
        }
    }

    async getCommunityDetails(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const result = await this._commAdminAuthService.getCommunityDetails(communityAdminId);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Get community details error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Failed to get community details"
            });
        }
    }

    async updateCommunity(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const result = await this._commAdminAuthService.updateCommunity(communityAdminId, req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Update community error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to update community"
            });
        }
    }

    async reapplyApplication(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            let logoUrl = '';
            let bannerUrl = '';

            // Handle file uploads to Cloudinary
            if (files?.logo?.[0]) {
                logoUrl = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "chainverse/community-logos",
                            transformation: [
                                { width: 200, height: 200, crop: "fill" },
                                { quality: "auto", format: "auto" },
                            ],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result?.secure_url || '');
                        }
                    );
                    stream.end(files.logo[0].buffer);
                });
            }

            if (files?.banner?.[0]) {
                bannerUrl = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "chainverse/community-banners",
                            transformation: [
                                { width: 1200, height: 400, crop: "fill" },
                                { quality: "auto", format: "auto" },
                            ],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result?.secure_url || '');
                        }
                    );
                    stream.end(files.banner[0].buffer);
                });
            }

            // Prepare the DTO with uploaded URLs
            const communityData = {
                ...req.body,
                logo: logoUrl,
                banner: bannerUrl,
            };

            const result = await this._commAdminAuthService.reapplyApplication(communityData);
            res.status(StatusCode.OK).json(result);
        } catch (error: any) {
            logger.error("Reapply application error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to reapply"
            });
        }
    }
}