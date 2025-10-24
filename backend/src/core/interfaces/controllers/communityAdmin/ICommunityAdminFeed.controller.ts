import { Request, Response } from "express";

export interface ICommunityAdminFeedController {
    getCommunityFeed(req: Request, res: Response): Promise<void>;
    togglePostLike(req: Request, res: Response): Promise<void>;
    createComment(req: Request, res: Response): Promise<void>;
    sharePost(req: Request, res: Response): Promise<void>;
    getEngagementStats(req: Request, res: Response): Promise<void>;
    pinPost(req: Request, res: Response): Promise<void>;
    deletePost(req: Request, res: Response): Promise<void>;
}