import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserProfileController } from "../../core/interfaces/controllers/user/IUserProfile.controller";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { updateProfileSchema, checkUsernameSchema } from "../../validations/user.validation";
import { z } from "zod";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import logger from "../../utils/logger";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class UserProfileController implements IUserProfileController {
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService
  ) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      console.log("Get profile controller called");
      const user = req.user as { id: string; role: string; tokenVersion?: number };
      
      if (!user || !user.id) {
        console.log("User not authenticated in controller");
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      console.log("Fetching profile for user:", user.id);
      const profile = await this._userService.getProfile(user.id);
      
      if (!profile) {
        console.log("Profile not found for user:", user.id);
        res.status(StatusCode.NOT_FOUND).json({ 
          success: false, 
          error: "User profile not found" 
        });
        return;
      }

      console.log("Profile found, sending response");
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: profile 
      });
    } catch (error) {
      const err = error as Error;
      console.error("Get profile controller error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to fetch user profile";
      logger.error("Get profile error:", { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      console.log("Update profile controller called");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      console.log("Update profile data:", req.body);
      const parsedData = updateProfileSchema.parse(req.body);
      const profile = await this._userService.updateProfile(user.id, parsedData);
      
      if (!profile) {
        res.status(StatusCode.NOT_FOUND).json({ 
          success: false, 
          error: "User profile not found" 
        });
        return;
      }

      console.log("Profile updated successfully");
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: profile,
        message: "Profile updated successfully"
      });
    } catch (error) {
      const err = error as Error;
      console.error("Update profile controller error:", err);
      if (error instanceof z.ZodError) {
        logger.warn("Update profile validation error:", { issues: error.issues });
        res.status(StatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: "Validation error",
          details: error.issues 
        });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = err.message || "Failed to update user profile";
        logger.error("Update profile error:", { message, stack: err.stack, userId: req.user });
        res.status(statusCode).json({ 
          success: false, 
          error: message 
        });
      }
    }
  }

  async checkUsername(req: Request, res: Response): Promise<void> {
    try {
      // console.log("Check username controller called");
      // const { username } = checkUsernameSchema.parse(req.body);
      
      // if (!username || username.trim() === "") {
      //   res.status(StatusCode.BAD_REQUEST).json({ 
      //     success: false, 
      //     error: "Username cannot be empty" 
      //   });
      //   return;
      // }

      // const isAvailable = await this._userService.checkUsernameAvailability(username, req.user?.id);
      // console.log("Username availability check result:", { username, available: isAvailable });
      
      // res.status(StatusCode.OK).json({ 
      //   success: true, 
      //   available: isAvailable 
      // });
    } catch (error) {
      const err = error as Error;
      console.error("Check username controller error:", err);
      if (error instanceof z.ZodError) {
        logger.warn("Check username validation error:", { issues: error.issues });
        res.status(StatusCode.BAD_REQUEST).json({ 
          success: false, 
          error: "Validation error",
          details: error.issues 
        });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = err.message || "Failed to check username availability";
        logger.error("Check username error:", { message, stack: err.stack, userId: req.user });
        res.status(statusCode).json({ 
          success: false, 
          error: message 
        });
      }
    }
  }

  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      console.log("Upload profile image controller called");
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

      console.log("Uploading image to Cloudinary");
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: "profile_images",
            transformation: [
              { width: 400, height: 400, crop: "fill" },
              { quality: "auto" }
            ]
          }, 
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(new CustomError("Failed to upload image to Cloudinary", StatusCode.INTERNAL_SERVER_ERROR));
            } else {
              resolve(result as UploadApiResponse);
            }
          }
        ).end(req.file!.buffer);
      });

      console.log("Image uploaded to Cloudinary, updating profile");
      const profile = await this._userService.updateProfile(user.id, { profilePic: result.secure_url });
      
      if (!profile) {
        res.status(StatusCode.NOT_FOUND).json({ 
          success: false, 
          error: "User profile not found" 
        });
        return;
      }

      console.log("Profile image updated successfully");
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: profile,
        message: "Profile image updated successfully"
      });
    } catch (error) {
      const err = error as Error;
      console.error("Upload profile image controller error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to upload profile image";
      logger.error("Upload profile image error:", { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }
}