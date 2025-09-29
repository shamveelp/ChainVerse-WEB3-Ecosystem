import { Request, Response } from "express";

export interface IFollowController {
    followUser(req: Request, res: Response): Promise<void>;
    unfollowUser(req: Request, res: Response): Promise<void>;
    getFollowers(req: Request, res: Response): Promise<void>;
    getFollowing(req: Request, res: Response): Promise<void>;
    getFollowStatus(req: Request, res: Response): Promise<void>;
    getFollowStats(req: Request, res: Response): Promise<void>;
    getUserFollowers(req: Request, res: Response): Promise<void>;
    getUserFollowing(req: Request, res: Response): Promise<void>;
}