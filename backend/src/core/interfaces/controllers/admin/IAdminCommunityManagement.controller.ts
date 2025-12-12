import { Request, Response } from "express";

export interface IAdminCommunityManagementController {
    getAllCommunities(req: Request, res: Response): Promise<void>;
    getCommunityById(req: Request, res: Response): Promise<void>;
    updateCommunityStatus(req: Request, res: Response): Promise<void>;
    updateVerificationStatus(req: Request, res: Response): Promise<void>;
    updateVerificationStatus(req: Request, res: Response): Promise<void>;
    deleteCommunity(req: Request, res: Response): Promise<void>;
    getCommunityMembers(req: Request, res: Response): Promise<void>;
    updateCommunitySettings(req: Request, res: Response): Promise<void>;
}
