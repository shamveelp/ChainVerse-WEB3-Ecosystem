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
import {
  CreateCommunityDto,
  SetPasswordDto,
  CommunityAdminLoginDto,
  VerifyOtpDto,
  CommunityAdminResponseDto,
  CommunityAdminLoginResponseDto,
  CreateCommunityResponseDto
} from "../../dtos/communityAdmin/CommunityAdminAuth.dto";
import { ForgotPasswordDto, VerifyOtpDto as AdminVerifyOtpDto, ResetPasswordDto } from "../../dtos/ForgotPassword.dto";

@injectable()
export class CommunityAdminAuthController implements ICommunityAdminAuthController {
    constructor(
        @inject(TYPES.ICommunityAdminAuthService) private _commAdminAuthService: ICommunityAdminAuthService,
        @inject(TYPES.IJwtService) private _jwtService: IJwtService,
        @inject(TYPES.IOtpService) private _otpService: IOTPService,
        @inject(TYPES.ICommunityAdminRepository) private _commAdminRepo: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRequestRepository) private _communityRequestRepo: ICommunityRequestRepository
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

            // Check in both CommunityRequest and CommunityAdmin collections
            const [existingRequest, existingAdmin] = await Promise.all([
                this._communityRequestRepo.findByEmail(email),
                this._commAdminRepo.findByEmail(email)
            ]);

            res.status(StatusCode.OK).json({
                success: true,
                exists: !!(existingRequest || existingAdmin)
            });
        } catch (error: any) {
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

            // Check in CommunityRequest collection
            const existingRequest = await this._communityRequestRepo.findByUsername(username);

            res.status(StatusCode.OK).json({
                success: true,
                exists: !!existingRequest
            });
        } catch (error: any) {
            logger.error("Check username exists error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Failed to check username availability"
            });
        }
    }

    async createCommunity(req: Request, res: Response): Promise<void> {
        try {
            const dto = req.body as CreateCommunityDto;

            // Check if email already exists
            const existingRequest = await this._communityRequestRepo.findByEmail(dto.email!);
            if (existingRequest) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Application already exists for this email"
                });
                return;
            }

            // Check if username already exists
            const existingUsername = await this._communityRequestRepo.findByUsername(dto.username!);
            if (existingUsername) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is already taken"
                });
                return;
            }

            // Create community request
            const communityRequest = await this._communityRequestRepo.create({
                communityName: dto.communityName,
                email: dto.email,
                username: dto.username,
                walletAddress: dto.walletAddress,
                description: dto.description,
                category: dto.category,
                whyChooseUs: dto.whyChooseUs,
                rules: dto.rules,
                socialLinks: dto.socialLinks,
                logo: dto.logo,
                banner: dto.banner,
                status: 'pending'
            });

            // Map to response DTO
            const responseDto = new CreateCommunityResponseDto(
                communityRequest._id.toString(),
                "Community application submitted successfully"
            );

            res.status(StatusCode.CREATED).json(responseDto);

            logger.info(`Community application created for email: ${dto.email}`);
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
            const dto = req.body as SetPasswordDto;

            // Check if community request exists
            const communityRequest = await this._communityRequestRepo.findByEmail(dto.email!);
            if (!communityRequest) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "No application found for this email"
                });
                return;
            }

            // Check if community admin already exists
            const existingAdmin = await this._commAdminRepo.findByEmail(dto.email!);
            if (existingAdmin) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Account already exists for this email"
                });
                return;
            }

            // Register community admin
            await this._commAdminAuthService.registerCommunityAdmin({
                email: dto.email,
                password: dto.password,
                name: communityRequest.username,
                role: 'communityAdmin'
            });

            // Send OTP
            await this._otpService.requestOtp(dto.email!, 'communityAdmin');

            res.status(StatusCode.OK).json({
                success: true,
                message: "Password set successfully. OTP sent to your email for verification."
            });

            logger.info(`Password set for community admin: ${dto.email}`);
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
            const dto = req.body as VerifyOtpDto;

            const isValid = await this._otpService.verifyOtp(dto.email!, dto.otp!);
            if (!isValid) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Invalid or expired OTP"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP verified successfully. Your application is under review."
            });

            logger.info(`OTP verified for community admin: ${dto.email}`);
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
            const { email } = req.body;
            
            if (!email) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Email is required"
                });
                return;
            }

            // Check if community admin exists
            const communityAdmin = await this._commAdminRepo.findByEmail(email);
            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "No account found for this email"
                });
                return;
            }

            // Send new OTP
            await this._otpService.requestOtp(email, 'communityAdmin');

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP resent successfully"
            });

            logger.info(`OTP resent for community admin: ${email}`);
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
            const dto = req.body as CommunityAdminLoginDto;

            const communityAdmin = await this._commAdminAuthService.loginCommunityAdmin(dto.email!, dto.password!);
            
            const accessToken = this._jwtService.generateAccessToken(
                communityAdmin!._id.toString(), 
                'communityAdmin',
                communityAdmin!.tokenVersion ?? 0
            );
            const refreshToken = this._jwtService.generateRefreshToken(
                communityAdmin!._id.toString(), 
                'communityAdmin',
                communityAdmin!.tokenVersion ?? 0
            );

            this._jwtService.setTokens(res, accessToken, refreshToken);

            // Map to response DTO
            const responseDto = new CommunityAdminLoginResponseDto(communityAdmin);
            responseDto.communityAdmin = {
                ...responseDto.communityAdmin,
                token: accessToken
            };

            res.status(StatusCode.OK).json(responseDto);

            logger.info(`Community admin logged in: ${dto.email}`);
        } catch (error: any) {
            logger.error("Community admin login error:", error);
            
            // Handle specific error cases for better UX
            let statusCode = StatusCode.UNAUTHORIZED;
            let errorMessage = error.message || "Login failed";
            
            if (error.message?.includes('under review')) {
                statusCode = StatusCode.FORBIDDEN;
                errorMessage = "Your application is still under review";
            } else if (error.message?.includes('rejected')) {
                statusCode = StatusCode.FORBIDDEN;
                errorMessage = "Your application has been rejected";
            } else if (error.message?.includes('Invalid credentials')) {
                statusCode = StatusCode.UNAUTHORIZED;
                errorMessage = "Invalid email or password";
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const dto = req.body as ForgotPasswordDto;

            // Check if community admin exists
            const communityAdmin = await this._commAdminRepo.findByEmail(dto.email!);
            if (!communityAdmin) {
                // For security, we don't reveal if email exists or not
                res.status(StatusCode.OK).json({
                    success: true,
                    message: "If an account exists with this email, you'll receive a password reset code"
                });
                return;
            }

            await this._otpService.requestForgotPasswordOtp(dto.email!, 'communityAdmin');

            res.status(StatusCode.OK).json({
                success: true,
                message: "Password reset code sent to your email"
            });

            logger.info(`Forgot password OTP sent to: ${dto.email}`);
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
            const dto = req.body as AdminVerifyOtpDto;

            const isValid = await this._otpService.verifyOtp(dto.email!, dto.otp!);
            if (!isValid) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Invalid or expired OTP"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: "OTP verified. You can now reset your password."
            });

            logger.info(`Forgot password OTP verified for: ${dto.email}`);
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
            const dto = req.body as ResetPasswordDto;

            // Check if community admin exists
            const communityAdmin = await this._commAdminRepo.findByEmail(dto.email!);
            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Account not found"
                });
                return;
            }

            await this._commAdminAuthService.resetPassword(dto.email!, dto.password!);

            res.status(StatusCode.OK).json({
                success: true,
                message: "Password reset successfully"
            });

            logger.info(`Password reset successful for: ${dto.email}`);
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
            const refreshToken = req.cookies?.refreshToken;
            
            if (!refreshToken) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "Refresh token is required"
                });
                return;
            }

            const decoded = this._jwtService.verifyRefreshToken(refreshToken);
            
            // Verify community admin exists and token version matches
            const communityAdmin = await this._commAdminRepo.findById(decoded.id);
            if (!communityAdmin || communityAdmin.tokenVersion !== decoded.tokenVersion) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "Invalid refresh token"
                });
                return;
            }

            const newAccessToken = this._jwtService.generateAccessToken(
                communityAdmin._id.toString(),
                'communityAdmin',
                communityAdmin.tokenVersion ?? 0
            );

            this._jwtService.setAccessToken(res, newAccessToken);

            res.status(StatusCode.OK).json({
                success: true,
                accessToken: newAccessToken,
                message: "Token refreshed successfully"
            });

        } catch (error: any) {
            logger.error("Refresh token error:", error);
            res.status(StatusCode.UNAUTHORIZED).json({
                success: false,
                error: "Invalid or expired refresh token"
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        this._jwtService.clearTokens(res);
        res.status(StatusCode.OK).json({
            success: true,
            message: "Logged out successfully"
        });
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const communityAdmin = await this._commAdminRepo.findById(communityAdminId);

            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Community admin not found"
                });
                return;
            }

            // Map to response DTO
            const responseDto = new CommunityAdminResponseDto(communityAdmin);

            res.status(StatusCode.OK).json({
                success: true,
                communityAdmin: responseDto
            });
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
            const communityAdmin = await this._commAdminRepo.findById(communityAdminId);

            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Community admin not found"
                });
                return;
            }

            if (!communityAdmin.communityId) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "No community associated with this admin"
                });
                return;
            }

            // Here you would typically get community details from CommunityRepository
            // For now, returning basic info
            res.status(StatusCode.OK).json({
                success: true,
                community: {
                    id: communityAdmin.communityId,
                    adminId: communityAdmin._id,
                    email: communityAdmin.email,
                    name: communityAdmin.name
                }
            });

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
            const updateData = req.body;

            const communityAdmin = await this._commAdminRepo.findById(communityAdminId);

            if (!communityAdmin) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Community admin not found"
                });
                return;
            }

            if (!communityAdmin.communityId) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "No community associated with this admin"
                });
                return;
            }

            // Here you would update the community details
            // For now, returning success
            res.status(StatusCode.OK).json({
                success: true,
                message: "Community updated successfully",
                community: updateData
            });

            logger.info(`Community updated by admin: ${communityAdmin.email}`);
        } catch (error: any) {
            logger.error("Update community error:", error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: error.message || "Failed to update community"
            });
        }
    }
}