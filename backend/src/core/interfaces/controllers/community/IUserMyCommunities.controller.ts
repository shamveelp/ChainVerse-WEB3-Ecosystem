import { Request, Response } from "express";

export interface IUserMyCommunitiesController {
    getMyCommunities(req: Request, res: Response): Promise<void>;
    getMyCommunitiesStats(req: Request, res: Response): Promise<void>;
    getMyCommunitiesActivity(req: Request, res: Response): Promise<void>;
    updateCommunityNotifications(req: Request, res: Response): Promise<void>;
    leaveCommunityFromMy(req: Request, res: Response): Promise<void>;
}