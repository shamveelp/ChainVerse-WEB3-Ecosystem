import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import { ICommunityAdminProfileController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminProfile.controller";
import { ICommunityAdminProfileService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminProfileService";

@injectable()
export class CommunityAdminProfileController implements ICommunityAdminProfileController {
    constructor(
        @inject(TYPES.ICommunityAdminProfileService) private _profileService: ICommunityAdminProfileService
    ) {}

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            console.log("Getting community admin profile for:", communityAdminId);

            const profile = await this._profileService.getProfile(communityAdminId);

            res.status(StatusCode.OK).json({
                success: true,
                data: profile
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community admin profile error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch profile";
            logger.error("Get community admin profile error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            console.log("Updating community admin profile for:", communityAdminId, "with data:", req.body);

            const updatedProfile = await this._profileService.updateProfile(communityAdminId, req.body);

            res.status(StatusCode.OK).json({
                success: true,
                data: updatedProfile,
                message: "Profile updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Update community admin profile error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update profile";
            logger.error("Update community admin profile error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async uploadProfilePicture(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            console.log("Uploading profile picture for community admin:", communityAdminId);

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "No file uploaded"
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
                            logger.error("Profile picture upload error:", error);
                            reject(new CustomError("Failed to upload profile picture", StatusCode.INTERNAL_SERVER_ERROR));
                        } else {
                            resolve(result);
                        }
                    }
                ).end(req.file!.buffer);
            });

            const updatedProfile = await this._profileService.updateProfile(communityAdminId, {
                profilePic: result.secure_url
            });

            console.log("Profile picture uploaded successfully");
            res.status(StatusCode.OK).json({
                success: true,
                data: updatedProfile,
                message: "Profile picture updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Upload profile picture error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to upload profile picture";
            logger.error("Upload profile picture error:", { message, stack: err.stack, adminId: (req as any).user?.id });
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
            
            console.log("Getting community stats for admin:", communityAdminId, "period:", period);

            const stats = await this._profileService.getCommunityStats(communityAdminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: stats
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community stats error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community stats";
            logger.error("Get community stats error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}