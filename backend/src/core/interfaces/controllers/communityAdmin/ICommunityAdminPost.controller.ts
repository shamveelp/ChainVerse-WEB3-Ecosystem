import { Request, Response } from "express";

export interface ICommunityAdminPostController {
    createPost(req: Request, res: Response): Promise<void>;
    getPostById(req: Request, res: Response): Promise<void>;
    updatePost(req: Request, res: Response): Promise<void>;
    deletePost(req: Request, res: Response): Promise<void>;
    getAdminPosts(req: Request, res: Response): Promise<void>;
    togglePostLike(req: Request, res: Response): Promise<void>;
    createComment(req: Request, res: Response): Promise<void>;
    getPostComments(req: Request, res: Response): Promise<void>;
    toggleCommentLike(req: Request, res: Response): Promise<void>;
    uploadPostMedia(req: Request, res: Response): Promise<void>;
    getCommunityMembersFeed(req: Request, res: Response): Promise<void>;
}