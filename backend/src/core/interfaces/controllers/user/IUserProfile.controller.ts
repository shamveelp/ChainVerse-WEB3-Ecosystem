import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../../middlewares/auth.middleware";

export interface IUserProfileController {
    getProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    checkUsername(req: AuthenticatedRequest, res: Response): Promise<void>;
}