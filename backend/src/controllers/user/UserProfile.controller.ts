import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserProfileController } from "../../core/interfaces/controllers/user/IUserProfile.controller";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { updateProfileSchema, checkUsernameSchema } from "../../validations/User.validation";
import { z } from "zod";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import logger from "../../utils/logger";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class UserProfileController implements IUserProfileController {
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService
  ) { }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {

      const user = req.user as { id: string; role: string; tokenVersion?: number };

      if (!user || !user.id) {

        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }


      const profile = await this._userService.getProfile(user.id);

      if (!profile) {

        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.USER_PROFILE_NOT_FOUND
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
      const message = err.message || ErrorMessages.FAILED_FETCH_USER_PROFILE;
      logger.error(LoggerMessages.GET_PROFILE_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {

      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }


      const parsedData = updateProfileSchema.parse(req.body);
      const profile = await this._userService.updateProfile(user.id, parsedData);

      if (!profile) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.USER_PROFILE_NOT_FOUND
        });
        return;
      }


      res.status(StatusCode.OK).json({
        success: true,
        data: profile,
        message: SuccessMessages.PROFILE_UPDATED
      });
    } catch (error) {
      const err = error as Error;
      if (error instanceof z.ZodError) {
        logger.warn("Update profile validation error:", { issues: error.issues });
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.VALIDATION_ERROR,
          details: error.issues
        });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = err.message || ErrorMessages.FAILED_UPDATE_USER_PROFILE;
        logger.error(LoggerMessages.UPDATE_PROFILE_ERROR, { message, stack: err.stack, userId: req.user });
        res.status(statusCode).json({
          success: false,
          error: message
        });
      }
    }
  }

  async checkUsername(req: Request, res: Response): Promise<void> {
    try {
      // 
      // const { username } = checkUsernameSchema.parse(req.body);

      // if (!username || username.trim() === "") {
      //   res.status(StatusCode.BAD_REQUEST).json({ 
      //     success: false, 
      //     error: "Username cannot be empty" 
      //   });
      //   return;
      // }

      // const isAvailable = await this._userService.checkUsernameAvailability(username, req.user?.id);
      // 

      // res.status(StatusCode.OK).json({ 
      //   success: true, 
      //   available: isAvailable 
      // });
    } catch (error) {
      const err = error as Error;
      if (error instanceof z.ZodError) {
        logger.warn("Check username validation error:", { issues: error.issues });
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.VALIDATION_ERROR,
          details: error.issues
        });
      } else {
        const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
        const message = err.message || ErrorMessages.FAILED_CHECK_USERNAME_AVAILABILITY;
        logger.error(LoggerMessages.CHECK_USERNAME_ERROR, { message, stack: err.stack, userId: req.user });
        res.status(statusCode).json({
          success: false,
          error: message
        });
      }
    }
  }

  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {

      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!req.file) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.NO_FILE_UPLOADED
        });
        return;
      }


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
              reject(new CustomError(ErrorMessages.FAILED_UPLOAD_IMAGE_CLOUDINARY, StatusCode.INTERNAL_SERVER_ERROR));
            } else {
              resolve(result as UploadApiResponse);
            }
          }
        ).end(req.file!.buffer);
      });


      const profile = await this._userService.updateProfile(user.id, { profilePic: result.secure_url });

      if (!profile) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.USER_PROFILE_NOT_FOUND
        });
        return;
      }


      res.status(StatusCode.OK).json({
        success: true,
        data: profile,
        message: SuccessMessages.PROFILE_IMAGE_UPDATED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_UPLOAD_PROFILE_IMAGE;
      logger.error(LoggerMessages.UPLOAD_PROFILE_IMAGE_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}