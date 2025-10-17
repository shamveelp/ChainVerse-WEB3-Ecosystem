import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { ICommunityUserProfileController } from "../../core/interfaces/controllers/community/ICommunityUserProfile.controller";
import { ICommunityUserService } from "../../core/interfaces/services/community/ICommunityUserService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { UpdateCommunityProfileDto } from "../../dtos/community/CommunityProfile.dto";
import { z } from "zod";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import logger from "../../utils/logger";

@injectable()
export class CommunityUserProfileController implements ICommunityUserProfileController {
    constructor(
        @inject(TYPES.ICommunityUserService) private _communityUserService: ICommunityUserService
    ) {}

    async getCommunityProfile(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string; tokenVersion?: number };
            
            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({ 
                    success: false, 
                    error: "User not authenticated" 
                });
                return;
            }

            const profile = await this._communityUserService.getCommunityProfile(user.id, user.id);
            
            if (!profile) {
                res.status(StatusCode.NOT_FOUND).json({ 
                    success: false, 
                    error: "User community profile not found" 
                });
                return;
            }
            res.status(StatusCode.OK).json({ 
                success: true, 
                data: profile 
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community profile";
            logger.error("Get community profile error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({ 
                success: false, 
                error: message 
            });
        }
    }

    async getCommunityProfileByUsername(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const user = req.user as { id: string; role: string } | undefined;

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({ 
                    success: false, 
                    error: "Username is required" 
                });
                return;
            }
            logger.info(`Fetching community profile for username: ${username}`);
            const profile = await this._communityUserService.getCommunityProfileByUsername(username, user?.id);
            
            if (!profile) {
                logger.warn(`Community profile not found for username: ${username}`);
                res.status(StatusCode.NOT_FOUND).json({ 
                    success: false, 
                    error: "User community profile not found" 
                });
                return;
            }

            res.status(StatusCode.OK).json({ 
                success: true, 
                data: profile 
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community profile";
            logger.error("Get community profile by username error:", { message, stack: err.stack, username: req.params.username });
            res.status(statusCode).json({ 
                success: false, 
                error: message 
            });
        }
    }

    async updateCommunityProfile(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            
            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({ 
                    success: false, 
                    error: "User not authenticated" 
                });
                return;
            }

            
            // Manual validation for UpdateCommunityProfileDto
            const updateData: UpdateCommunityProfileDto = {};
            
            if (req.body.bio !== undefined) updateData.bio = req.body.bio;
            if (req.body.location !== undefined) updateData.location = req.body.location;
            if (req.body.website !== undefined) updateData.website = req.body.website;
            if (req.body.bannerImage !== undefined) updateData.bannerImage = req.body.bannerImage;
            if (req.body.socialLinks !== undefined) updateData.socialLinks = req.body.socialLinks;
            if (req.body.settings !== undefined) updateData.settings = req.body.settings;

            const profile = await this._communityUserService.updateCommunityProfile(user.id, updateData);
            
            if (!profile) {
                res.status(StatusCode.NOT_FOUND).json({ 
                    success: false, 
                    error: "User community profile not found" 
                });
                return;
            }

            res.status(StatusCode.OK).json({ 
                success: true, 
                data: profile,
                message: "Community profile updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update community profile";
            logger.error("Update community profile error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({ 
                success: false, 
                error: message 
            });
        }
    }

    async uploadBannerImage(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            
            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({ 
                    success: false, 
                    error: "User not authenticated" 
                });
                return;
            }

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({ 
                    success: false, 
                    error: "No file uploaded" 
                });
                return;
            }

            const result: UploadApiResponse = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { 
                        folder: "banner_images",
                        transformation: [
                            { width: 1200, height: 400, crop: "fill" },
                            { quality: "auto" }
                        ]
                    }, 
                    (error, result) => {
                        if (error) {
                            reject(new CustomError("Failed to upload image to Cloudinary", StatusCode.INTERNAL_SERVER_ERROR));
                        } else {
                            resolve(result as UploadApiResponse);
                        }
                    }
                ).end(req.file!.buffer);
            });

            const profile = await this._communityUserService.uploadBannerImage(user.id, result.secure_url);
            
            if (!profile) {
                res.status(StatusCode.NOT_FOUND).json({ 
                    success: false, 
                    error: "User community profile not found" 
                });
                return;
            }

            res.status(StatusCode.OK).json({ 
                success: true, 
                data: profile,
                message: "Banner image updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to upload banner image";
            logger.error("Upload banner image error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({ 
                success: false, 
                error: message 
            });
        }
    }
}

