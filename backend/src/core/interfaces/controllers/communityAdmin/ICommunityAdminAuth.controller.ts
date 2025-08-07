import type { Request, Response } from "express";

export interface ICommunityAdminAuthController {
    createCommunity(req: Request, res: Response): Promise<void>;
    setPassword(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    verifyForgotPasswordOtp(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
}
