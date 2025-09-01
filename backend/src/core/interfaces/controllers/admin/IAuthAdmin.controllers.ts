import { Request, Response } from "express";

export interface IAdminAuthController {
  login(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  verifyForgotPasswordOtp(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  getProfile(req: Request, res: Response): Promise<void>;
  changePassword(req: Request, res: Response): Promise<void>;
}