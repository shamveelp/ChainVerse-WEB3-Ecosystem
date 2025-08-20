import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserProfileController } from "../../core/interfaces/controllers/user/IUserProfile.controller";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class UserProfileController implements IUserProfileController {
    constructor(
        @inject(TYPES.IUserService) private userService: IUserService
    ) { }

    async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            console.log("Getting profile for user ID:", userId);
            console.log("Full user object:", req.user);
            
            if (!userId) {
                console.log("No user ID found in request");
                throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
            }

            const user = await this.userService.getProfile(userId);
            console.log("Profile service returned:", user ? "User data" : "null");
            
            if (!user) {
                console.log("User profile not found for ID:", userId);
                throw new CustomError("User profile not found", StatusCode.NOT_FOUND);
            }

            console.log("Sending user profile response");
            res.status(StatusCode.OK).json(user);
        } catch (error) {
            console.error("Error in getProfile controller:", error);
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
                    error: "Failed to fetch profile" 
                });
            }
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
            }

            const updateData = req.body;
            
            // Validate required fields
            if (updateData.name && updateData.name.trim().length < 2) {
                throw new CustomError("Name must be at least 2 characters long", StatusCode.BAD_REQUEST);
            }
            
            if (updateData.username && updateData.username.trim().length < 3) {
                throw new CustomError("Username must be at least 3 characters long", StatusCode.BAD_REQUEST);
            }

            // Username validation pattern
            if (updateData.username && !/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
                throw new CustomError("Username can only contain letters, numbers, and underscores", StatusCode.BAD_REQUEST);
            }

            const updatedUser = await this.userService.updateProfile(userId, updateData);
            
            res.status(StatusCode.OK).json(updatedUser);
        } catch (error) {
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
                    error: "Failed to update profile" 
                });
            }
        }
    }

    async checkUsername(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { username } = req.body;
            const userId = req.user?.id;

            if (!username || username.trim().length < 3) {
                throw new CustomError("Username must be at least 3 characters long", StatusCode.BAD_REQUEST);
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                throw new CustomError("Username can only contain letters, numbers, and underscores", StatusCode.BAD_REQUEST);
            }

            const available = await this.userService.checkUsernameAvailability(username, userId);
            
            res.status(StatusCode.OK).json({ available });
        } catch (error) {
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
                    error: "Failed to check username availability" 
                });
            }
        }
    }
}