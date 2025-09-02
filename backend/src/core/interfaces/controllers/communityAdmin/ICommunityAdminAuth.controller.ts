import type { Request, Response } from "express";

export interface ICommunityAdminAuthController {
    // Live validation
    checkEmailExists(req: Request, res: Response): Promise<void>;
    checkUsernameExists(req: Request, res: Response): Promise<void>;
    
    // Application flow
    createCommunity(req: Request, res: Response): Promise<void>;
    setPassword(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    resendOtp(req: Request, res: Response): Promise<void>;
    
    // Authentication
    login(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    refreshToken(req: Request, res: Response): Promise<void>;
    
    // Password reset
    forgotPassword(req: Request, res: Response): Promise<void>;
    verifyForgotPasswordOtp(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    
    // Profile & Community management
    getProfile(req: Request, res: Response): Promise<void>;
    getCommunityDetails(req: Request, res: Response): Promise<void>;
    updateCommunity(req: Request, res: Response): Promise<void>;
}