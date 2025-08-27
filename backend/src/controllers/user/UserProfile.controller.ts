// backend/src/controllers/user/userProfile.controller.ts
import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserProfileController } from "../../core/interfaces/controllers/user/IUserProfile.controller";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";
import { updateProfileSchema, checkUsernameSchema } from "../../validations/user.validation";
import { z } from "zod";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

@injectable()
export class UserProfileController implements IUserProfileController {
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService
  ) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string; tokenVersion?: number };
      if (!user || !user.id) {
        throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
      }

      const profile = await this._userService.getProfile(user.id);
      if (!profile) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      res.status(StatusCode.OK).json({ success: true, data: profile });
    } catch (error: any) {
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to fetch profile";
      console.error("Get profile error:", { message, stack: error.stack });
      res.status(statusCode).json({ success: false, error: message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      if (!user || !user.id) {
        throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
      }

      const parsedData = updateProfileSchema.parse(req.body);
      const profile = await this._userService.updateProfile(user.id, parsedData);
      res.status(StatusCode.OK).json({ success: true, data: profile });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, error: error.issues });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = error.message || "Failed to update profile";
        console.error("Update profile error:", { message, stack: error.stack });
        res.status(statusCode).json({ success: false, error: message });
      }
    }
  }

  async checkUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = checkUsernameSchema.parse(req.body);
      const isAvailable = await this._userService.checkUsernameAvailability(username);
      res.status(StatusCode.OK).json({ success: true, available: isAvailable });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, error: error.issues });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = error.message || "Failed to check username";
        console.error("Check username error:", { message, stack: error.stack });
        res.status(statusCode).json({ success: false, error: message });
      }
    }
  }

  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      if (!user || !user.id) {
        throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new CustomError("No file uploaded", StatusCode.BAD_REQUEST);
      }

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "profile_images" }, (error, result) => {
          if (error) {
            reject(new CustomError("Failed to upload image", StatusCode.INTERNAL_SERVER_ERROR));
          } else {
            resolve(result as UploadApiResponse);
          }
        }).end(req.file!.buffer);
      });

      const profile = await this._userService.updateProfile(user.id, { profilePic: result.secure_url });
      res.status(StatusCode.OK).json({ success: true, data: profile });
    } catch (error: any) {
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to upload profile image";
      console.error("Upload profile image error:", { message, stack: error.stack });
      res.status(statusCode).json({ success: false, error: message });
    }
  }
}