import { Request, Response } from "express";

export interface ICommunityAdminDashboardController {
    getDashboardData(req: Request, res: Response): Promise<void>;
    getCommunityOverview(req: Request, res: Response): Promise<void>;
    getCommunityStats(req: Request, res: Response): Promise<void>;
}
