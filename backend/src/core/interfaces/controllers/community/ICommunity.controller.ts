import { Request, Response } from "express";

export interface ICommunityController {
    getCommunityById(req: Request, res: Response): Promise<void>;
    getCommunityByUsername(req: Request, res: Response): Promise<void>;
    searchCommunities(req: Request, res: Response): Promise<void>;
    getPopularCommunities(req: Request, res: Response): Promise<void>;
    joinCommunity(req: Request, res: Response): Promise<void>;
    leaveCommunity(req: Request, res: Response): Promise<void>;
    getCommunityMembers(req: Request, res: Response): Promise<void>;
    getCommunityMemberStatus(req: Request, res: Response): Promise<void>;
}