import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserProfileController } from "../../core/interfaces/controllers/user/IUserProfile.controller";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { JwtPayload } from "../../core/interfaces/services/IJwtService";

@injectable()
export class UserProfileController implements IUserProfileController {
    constructor(
        @inject(TYPES.IUserService) private _userService: IUserService
    ) { }

    async getProfile(req: AuthenticatedRequest, res: Response) {
        try {
            const jwtUser = req.user as JwtPayload;
            const id = jwtUser.id;
            const user = await this._userService.getProfile(id);
            res.status(StatusCode.OK).json(user);
        } catch (error) {
            res.status(StatusCode.BAD_REQUEST).json({ error: "Failed to fetch user profile" });
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new CustomError("User not authenticated", StatusCode.UNAUTHORIZED);
            }

            const updateData = req.body;
            
            
            if (updateData.name && updateData.name.trim().length < 2) {
                throw new CustomError("Name must be at least 2 characters long", StatusCode.BAD_REQUEST);
            }
            
            if (updateData.username && updateData.username.trim().length < 3) {
                throw new CustomError("Username must be at least 3 characters long", StatusCode.BAD_REQUEST);
            }

            
            if (updateData.username && !/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
                throw new CustomError("Username can only contain letters, numbers, and underscores", StatusCode.BAD_REQUEST);
            }

            const updatedUser = await this._userService.updateProfile(userId, updateData);
            
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

            const available = await this._userService.checkUsernameAvailability(username, userId);
            
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