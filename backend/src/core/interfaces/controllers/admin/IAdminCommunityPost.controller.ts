
import { Request, Response } from "express";

export interface IAdminCommunityPostController {
    getAllPosts(req: Request, res: Response): Promise<void>;
    softDeletePost(req: Request, res: Response): Promise<void>;
    getPostDetails(req: Request, res: Response): Promise<void>;
    getPostComments(req: Request, res: Response): Promise<void>;
    getPostLikers(req: Request, res: Response): Promise<void>;
}
