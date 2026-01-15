import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ICommunityAdminAuthController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminAuth.controller";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuth.service";
import cloudinary from "../../config/cloudinary";
import { ErrorMessages, LoggerMessages, Messages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminAuthController implements ICommunityAdminAuthController {
    constructor(
        @inject(TYPES.ICommunityAdminAuthService) private _commAdminAuthService: ICommunityAdminAuthService
    ) { }

    /**
     * Checks if an email address is already registered.
     * @param req - Express Request object containing email in query.
     * @param res - Express Response object.
     */
    async checkEmailExists(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.query;

            if (!email || typeof email !== 'string') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: Messages.EMAIL_REQUIRED
                });
                return;
            }

            const result = await this._commAdminAuthService.checkEmailExists(email);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            logger.error(LoggerMessages.CHECK_EMAIL_EXISTS_ERROR, error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: Messages.FAILED_CHECK_EMAIL
            });
        }
    }

    /**
     * Checks if a username is already taken.
     * @param req - Express Request object containing username in query.
     * @param res - Express Response object.
     */
    async checkUsernameExists(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.query;

            if (!username || typeof username !== 'string') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: Messages.USERNAME_REQUIRED
                });
                return;
            }

            const result = await this._commAdminAuthService.checkUsernameExists(username);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            logger.error(LoggerMessages.CHECK_USERNAME_EXISTS_ERROR, error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: Messages.FAILED_CHECK_USERNAME
            });
        }
    }

    /**
     * Creates a new community application.
     * @param req - Express Request object containing application data and optional files.
     * @param res - Express Response object.
     */
    async createCommunity(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            let logoUrl = '';
            let bannerUrl = '';

            // Handle file uploads to Cloudinary
            if (files?.logo?.[0]) {
                try {
                    logoUrl = await new Promise<string>((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: "chainverse/community-logos",
                                transformation: [
                                    { width: 200, height: 200, crop: "fill" },
                                    { quality: "auto", format: "auto" },
                                ],
                            },
                            (error, result) => {
                                if (error) {
                                    logger.error(LoggerMessages.LOGO_UPLOAD_ERROR, error);
                                    reject(new Error(Messages.FAILED_UPLOAD_LOGO));
                                } else if (result) {
                                    resolve(result.secure_url);
                                } else {
                                    reject(new Error(Messages.NO_RESULT_FROM_CLOUDINARY));
                                }
                            }
                        );
                        stream.end(files.logo[0].buffer);
                    });
                } catch (uploadError) {
                    logger.error(LoggerMessages.LOGO_UPLOAD_FAILED, uploadError);
                    // Continue without logo, don't fail the entire request
                }
            }

            if (files?.banner?.[0]) {
                try {
                    bannerUrl = await new Promise<string>((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: "chainverse/community-banners",
                                transformation: [
                                    { width: 1200, height: 400, crop: "fill" },
                                    { quality: "auto", format: "auto" },
                                ],
                            },
                            (error, result) => {
                                if (error) {
                                    logger.error(LoggerMessages.BANNER_UPLOAD_ERROR, error);
                                    reject(new Error(ErrorMessages.FAILED_UPLOAD_BANNER));
                                } else if (result) {
                                    resolve(result.secure_url);
                                } else {
                                    reject(new Error(Messages.NO_RESULT_FROM_CLOUDINARY));
                                }
                            }
                        );
                        stream.end(files.banner[0].buffer);
                    });
                } catch (uploadError) {
                    logger.error(LoggerMessages.BANNER_UPLOAD_FAILED, uploadError);
                    // Continue without banner, don't fail the entire request
                }
            }

            // Prepare the DTO with uploaded URLs
            const communityData = {
                ...req.body,
                logo: logoUrl,
                banner: bannerUrl,
            };

            const result = await this._commAdminAuthService.createCommunityApplication(communityData);
            res.status(StatusCode.CREATED).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.CREATE_COMMUNITY_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_SUBMIT_APPLICATION
            });
        }
    }

    /**
     * Sets the password for a community admin account.
     * @param req - Express Request object containing password data.
     * @param res - Express Response object.
     */
    async setPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.setPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.SET_PASSWORD_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_SET_PASSWORD
            });
        }
    }

    /**
     * Verifies the OTP sent to the community admin.
     * @param req - Express Request object containing OTP data.
     * @param res - Express Response object.
     */
    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.verifyOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.VERIFY_OTP_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_OTP_VERIFICATION
            });
        }
    }

    /**
     * Resends the OTP to the community admin.
     * @param req - Express Request object containing user identifier.
     * @param res - Express Response object.
     */
    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.resendOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.RESEND_OTP_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_RESEND_OTP
            });
        }
    }

    /**
     * Logs in a community admin.
     * @param req - Express Request object containing login credentials.
     * @param res - Express Response object.
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.loginCommunityAdmin(req.body, res);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.COMMUNITY_ADMIN_LOGIN_ERROR, error);
            let statusCode = StatusCode.UNAUTHORIZED;
            const errorMessage = err.message || Messages.FAILED_LOGIN;

            if (err.message?.includes('under review')) {
                statusCode = StatusCode.FORBIDDEN;
            } else if (err.message?.includes('rejected')) {
                statusCode = StatusCode.FORBIDDEN;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

    /**
     * Initiates the forgot password process.
     * @param req - Express Request object containing email.
     * @param res - Express Response object.
     */
    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.forgotPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.FORGOT_PASSWORD_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_RESET_CODE
            });
        }
    }

    /**
     * Verifies the OTP for forgot password.
     * @param req - Express Request object containing OTP.
     * @param res - Express Response object.
     */
    async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.verifyForgotPasswordOtp(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.VERIFY_FORGOT_PASSWORD_OTP_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_OTP_VERIFICATION
            });
        }
    }

    /**
     * Resets the password using a verified token.
     * @param req - Express Request object containing new password and token.
     * @param res - Express Response object.
     */
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.resetPassword(req.body);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.RESET_PASSWORD_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_RESET_PASSWORD
            });
        }
    }

    /**
     * Refreshes the authentication token.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.refreshToken(req, res);
            res.status(StatusCode.OK).json(result);
        } catch (error) {

            logger.error(LoggerMessages.REFRESH_TOKEN_ERROR, error);
            res.status(StatusCode.UNAUTHORIZED).json({
                success: false,
                error: Messages.INVALID_REFRESH_TOKEN
            });
        }
    }

    /**
     * Logs out the community admin.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async logout(req: Request, res: Response): Promise<void> {
        try {
            const result = await this._commAdminAuthService.logout(res);
            res.status(StatusCode.OK).json(result);
        } catch (error) {

            logger.error(LoggerMessages.LOGOUT_ERROR, error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: Messages.FAILED_LOGOUT
            });
        }
    }

    /**
     * Retrieves the profile of the logged-in community admin.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const result = await this._commAdminAuthService.getProfile(communityAdminId);
            res.status(StatusCode.OK).json(result);
        } catch (error) {

            logger.error(LoggerMessages.GET_PROFILE_ERROR, error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: Messages.FAILED_GET_PROFILE
            });
        }
    }

    /**
     * Retrieves details of the community managed by the admin.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getCommunityDetails(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const result = await this._commAdminAuthService.getCommunityDetails(communityAdminId);
            res.status(StatusCode.OK).json(result);
        } catch (error) {

            logger.error(LoggerMessages.GET_COMMUNITY_DETAILS_ERROR, error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: Messages.FAILED_GET_COMMUNITY_DETAILS
            });
        }
    }

    /**
     * Updates community details.
     * @param req - Express Request object containing updates and optional files.
     * @param res - Express Response object.
     */
    async updateCommunity(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const updatePayload: Record<string, any> = { ...req.body };

            const parseJsonField = (value: any, fallback: any) => {
                if (typeof value === 'string' && value.trim() !== '') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return fallback;
                    }
                }
                return value ?? fallback;
            };

            if ('rules' in updatePayload) {
                const parsedRules = parseJsonField(updatePayload.rules, []);
                updatePayload.rules = Array.isArray(parsedRules)
                    ? parsedRules.filter((rule: string) => typeof rule === 'string' && rule.trim() !== '')
                    : [];
            }

            if ('socialLinks' in updatePayload) {
                const parsedLinks = parseJsonField(updatePayload.socialLinks, {});
                updatePayload.socialLinks = parsedLinks ? [parsedLinks] : [];
            }

            if ('settings' in updatePayload) {
                updatePayload.settings = parseJsonField(updatePayload.settings, undefined);
            }

            const uploadImage = async (
                file: Express.Multer.File,
                folder: string,
                transformation: Record<string, unknown>[]
            ): Promise<string | undefined> => {
                try {
                    const result = await new Promise<any>((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                folder,
                                transformation,
                            },
                            (error, uploadResult) => {
                                if (error) {
                                    logger.error(LoggerMessages.COMMUNITY_MEDIA_UPLOAD_ERROR, error);
                                    reject(error);
                                } else {
                                    resolve(uploadResult);
                                }
                            }
                        ).end(file.buffer);
                    });
                    return result?.secure_url;
                } catch (error) {
                    logger.error(LoggerMessages.FAILED_UPLOAD_COMMUNITY_MEDIA, error);
                    return undefined;
                }
            };

            // Handle logo upload or removal
            if (files?.logo?.[0]) {
                const logoUrl = await uploadImage(files.logo[0], "chainverse/community-logos", [
                    { width: 400, height: 400, crop: "fill" },
                    { quality: "auto", format: "auto" },
                ]);
                if (logoUrl) {
                    updatePayload.logo = logoUrl;
                }
            } else if (updatePayload.logo === '') {
                // Explicitly remove logo if empty string is sent
                updatePayload.logo = '';
            }

            // Handle banner upload or removal
            if (files?.banner?.[0]) {
                const bannerUrl = await uploadImage(files.banner[0], "chainverse/community-banners", [
                    { width: 1600, height: 600, crop: "fill" },
                    { quality: "auto", format: "auto" },
                ]);
                if (bannerUrl) {
                    updatePayload.banner = bannerUrl;
                }
            } else if (updatePayload.banner === '') {
                // Explicitly remove banner if empty string is sent
                updatePayload.banner = '';
            }


            const result = await this._commAdminAuthService.updateCommunity(communityAdminId, updatePayload);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.UPDATE_COMMUNITY_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_UPDATE_COMMUNITY
            });
        }
    }

    /**
     * Reapplies for a community application.
     * @param req - Express Request object containing application data and optional files.
     * @param res - Express Response object.
     */
    async reapplyApplication(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            let logoUrl = '';
            let bannerUrl = '';

            // Handle file uploads to Cloudinary
            if (files?.logo?.[0]) {
                try {
                    logoUrl = await new Promise<string>((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: "chainverse/community-logos",
                                transformation: [
                                    { width: 200, height: 200, crop: "fill" },
                                    { quality: "auto", format: "auto" },
                                ],
                            },
                            (error, result) => {
                                if (error) {
                                    logger.error(LoggerMessages.LOGO_UPLOAD_ERROR, error);
                                    reject(new Error(Messages.FAILED_UPLOAD_LOGO));
                                } else if (result) {
                                    resolve(result.secure_url);
                                } else {
                                    reject(new Error(Messages.NO_RESULT_FROM_CLOUDINARY));
                                }
                            }
                        );
                        stream.end(files.logo[0].buffer);
                    });
                } catch (uploadError) {
                    logger.error(LoggerMessages.LOGO_UPLOAD_FAILED, uploadError);
                    // Continue without logo, don't fail the entire request
                }
            }

            if (files?.banner?.[0]) {
                try {
                    bannerUrl = await new Promise<string>((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: "chainverse/community-banners",
                                transformation: [
                                    { width: 1200, height: 400, crop: "fill" },
                                    { quality: "auto", format: "auto" },
                                ],
                            },
                            (error, result) => {
                                if (error) {
                                    logger.error(LoggerMessages.BANNER_UPLOAD_ERROR, error);
                                    reject(new Error(ErrorMessages.FAILED_UPLOAD_BANNER));
                                } else if (result) {
                                    resolve(result.secure_url);
                                } else {
                                    reject(new Error(Messages.NO_RESULT_FROM_CLOUDINARY));
                                }
                            }
                        );
                        stream.end(files.banner[0].buffer);
                    });
                } catch (uploadError) {
                    logger.error(LoggerMessages.BANNER_UPLOAD_FAILED, uploadError);
                    // Continue without banner, don't fail the entire request
                }
            }

            // Prepare the DTO with uploaded URLs
            const communityData = {
                ...req.body,
                logo: logoUrl,
                banner: bannerUrl,
            };

            const result = await this._commAdminAuthService.reapplyApplication(communityData);
            res.status(StatusCode.OK).json(result);
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.REAPPLY_APPLICATION_ERROR, error);
            res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                error: err.message || Messages.FAILED_REAPPLY
            });
        }
    }
}