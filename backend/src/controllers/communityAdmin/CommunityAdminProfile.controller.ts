import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import cloudinary, { UploadApiResponse } from "../../config/cloudinary";
import { ICommunityAdminProfileController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminProfile.controller";
import { ICommunityAdminProfileService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminProfile.service";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class CommunityAdminProfileController implements ICommunityAdminProfileController {
    constructor(
        @inject(TYPES.ICommunityAdminProfileService) private _profileService: ICommunityAdminProfileService
    ) { }

    /**
     * Retrieves the profile of the logged-in community admin.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as AuthenticatedRequest).user?.id;
            if (!communityAdminId) throw new Error("User ID not found in request");

            const profile = await this._profileService.getProfile(communityAdminId);

            res.status(StatusCode.OK).json({
                success: true,
                data: profile
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_PROFILE;
            logger.error(LoggerMessages.GET_PROFILE_ERROR, { message, stack: err.stack, adminId: (req as AuthenticatedRequest).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Updates the profile of the community admin.
     * @param req - Express Request object containing profile updates in body.
     * @param res - Express Response object.
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as AuthenticatedRequest).user?.id;
            if (!communityAdminId) throw new Error("User ID not found in request");

            const updatedProfile = await this._profileService.updateProfile(communityAdminId, req.body);

            res.status(StatusCode.OK).json({
                success: true,
                data: updatedProfile,
                message: SuccessMessages.PROFILE_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_PROFILE;
            logger.error(LoggerMessages.UPDATE_PROFILE_ERROR, { message, stack: err.stack, adminId: (req as AuthenticatedRequest).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Uploads and updates the profile picture.
     * @param req - Express Request object containing the file.
     * @param res - Express Response object.
     */
    async uploadProfilePicture(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as AuthenticatedRequest).user?.id;
            if (!communityAdminId) throw new Error("User ID not found in request");

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_FILE_UPLOADED
                });
                return;
            }

            // Upload to Cloudinary
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "chainverse/community-admin-profiles",
                        transformation: [
                            { width: 400, height: 400, crop: "fill" },
                            { quality: "auto", format: "auto" },
                        ],
                    },
                    (error, uploadResult) => {
                        if (error) {
                            logger.error(LoggerMessages.CLOUDINARY_PROFILE_UPLOAD_ERROR, error);
                            reject(new CustomError(ErrorMessages.FAILED_UPLOAD_PROFILE_PICTURE, StatusCode.INTERNAL_SERVER_ERROR));
                        } else if (uploadResult) {
                            resolve(uploadResult);
                        } else {
                            reject(new Error("No result from upload"));
                        }
                    }
                ).end(req.file!.buffer);
            });

            const updatedProfile = await this._profileService.updateProfile(communityAdminId, {
                profilePic: result.secure_url
            });

            res.status(StatusCode.OK).json({
                success: true,
                data: updatedProfile,
                message: SuccessMessages.PROFILE_PICTURE_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPLOAD_PROFILE_PICTURE;
            logger.error(LoggerMessages.UPLOAD_PROFILE_PICTURE_ERROR, { message, stack: err.stack, adminId: (req as AuthenticatedRequest).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Uploads and updates the banner image.
     * @param req - Express Request object containing the file.
     * @param res - Express Response object.
     */
    async uploadBannerImage(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as AuthenticatedRequest).user?.id;
            if (!communityAdminId) throw new Error("User ID not found in request");

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_FILE_UPLOADED
                });
                return;
            }

            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "chainverse/community-admin-banners",
                        transformation: [
                            { width: 1600, height: 600, crop: "fill" },
                            { quality: "auto", format: "auto" },
                        ],
                    },
                    (error, uploadResult) => {
                        if (error) {
                            logger.error(LoggerMessages.CLOUDINARY_BANNER_UPLOAD_ERROR, error);
                            reject(new CustomError(ErrorMessages.FAILED_UPLOAD_BANNER, StatusCode.INTERNAL_SERVER_ERROR));
                        } else if (uploadResult) {
                            resolve(uploadResult);
                        } else {
                            reject(new Error("No result from upload"));
                        }
                    }
                ).end(req.file!.buffer);
            });

            const updatedProfile = await this._profileService.updateProfile(communityAdminId, {
                bannerImage: result.secure_url
            });

            res.status(StatusCode.OK).json({
                success: true,
                data: updatedProfile,
                message: SuccessMessages.BANNER_IMAGE_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPLOAD_BANNER;
            logger.error(LoggerMessages.UPLOAD_BANNER_IMAGE_ERROR, { message, stack: err.stack, adminId: (req as AuthenticatedRequest).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves community statistics for the admin's profile.
     * @param req - Express Request object containing period in query.
     * @param res - Express Response object.
     */
    async getCommunityStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as AuthenticatedRequest).user?.id;
            if (!communityAdminId) throw new Error("User ID not found in request");

            const { period = 'week' } = req.query;

            const stats = await this._profileService.getCommunityStats(communityAdminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: stats
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_COMMUNITY_STATS;
            logger.error(LoggerMessages.GET_COMMUNITY_STATS_ERROR, { message, stack: err.stack, adminId: (req as AuthenticatedRequest).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}