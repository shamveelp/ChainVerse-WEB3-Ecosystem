import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import { ICommunityAdminProfileController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminProfile.controller";
import { ICommunityAdminProfileService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminProfileService";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminProfileController implements ICommunityAdminProfileController {
    constructor(
        @inject(TYPES.ICommunityAdminProfileService) private _profileService: ICommunityAdminProfileService
    ) { }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;


            const profile = await this._profileService.getProfile(communityAdminId);

            res.status(StatusCode.OK).json({
                success: true,
                data: profile
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_PROFILE;
            logger.error(LoggerMessages.GET_PROFILE_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;


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
            logger.error(LoggerMessages.UPDATE_PROFILE_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async uploadProfilePicture(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;


            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_FILE_UPLOADED
                });
                return;
            }

            // Upload to Cloudinary
            const result = await new Promise<any>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "chainverse/community-admin-profiles",
                        transformation: [
                            { width: 400, height: 400, crop: "fill" },
                            { quality: "auto", format: "auto" },
                        ],
                    },
                    (error, result) => {
                        if (error) {
                            logger.error(LoggerMessages.CLOUDINARY_PROFILE_UPLOAD_ERROR, error);
                            reject(new CustomError(ErrorMessages.FAILED_UPLOAD_PROFILE_PICTURE, StatusCode.INTERNAL_SERVER_ERROR));
                        } else {
                            resolve(result);
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
            logger.error(LoggerMessages.UPLOAD_PROFILE_PICTURE_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async uploadBannerImage(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_FILE_UPLOADED
                });
                return;
            }

            const result = await new Promise<any>((resolve, reject) => {
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
                        } else {
                            resolve(uploadResult);
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
            logger.error(LoggerMessages.UPLOAD_BANNER_IMAGE_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommunityStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
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
            logger.error(LoggerMessages.GET_COMMUNITY_STATS_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}