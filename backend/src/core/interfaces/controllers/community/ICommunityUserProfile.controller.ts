import { Request, Response } from "express";

export interface ICommunityUserProfileController {
    getCommunityProfile(req: Request, res: Response): Promise<void>;
    getCommunityProfileByUsername(req: Request, res: Response): Promise<void>;
    updateCommunityProfile(req: Request, res: Response): Promise<void>;
    uploadBannerImage(req: Request, res: Response): Promise<void>;
}