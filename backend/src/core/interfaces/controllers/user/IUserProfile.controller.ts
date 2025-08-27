import { Request, Response } from "express";

export interface IUserProfileController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  checkUsername(req: Request, res: Response): Promise<void>;
  uploadProfileImage(req: Request, res: Response): Promise<void>;
}