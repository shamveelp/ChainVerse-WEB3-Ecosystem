import { Request, Response } from "express";

export interface IPostController {
    // Post CRUD operations
    createPost(req: Request, res: Response): Promise<void>;
    getPostById(req: Request, res: Response): Promise<void>;
    updatePost(req: Request, res: Response): Promise<void>;
    deletePost(req: Request, res: Response): Promise<void>;
    
    // Post queries
    getFeedPosts(req: Request, res: Response): Promise<void>;
    getUserPosts(req: Request, res: Response): Promise<void>;
    getLikedPosts(req: Request, res: Response): Promise<void>;
    getTrendingPosts(req: Request, res: Response): Promise<void>;
    getPostsByHashtag(req: Request, res: Response): Promise<void>;
    searchPosts(req: Request, res: Response): Promise<void>;
    
    // Like operations
    togglePostLike(req: Request, res: Response): Promise<void>;
    toggleCommentLike(req: Request, res: Response): Promise<void>;
    getPostLikers(req: Request, res: Response): Promise<void>;
    
    // Comment operations
    createComment(req: Request, res: Response): Promise<void>;
    updateComment(req: Request, res: Response): Promise<void>;
    deleteComment(req: Request, res: Response): Promise<void>;
    getPostComments(req: Request, res: Response): Promise<void>;
    getCommentReplies(req: Request, res: Response): Promise<void>;
    
    // Media operations
    uploadPostMedia(req: Request, res: Response): Promise<void>;
    
    // Share operations
    sharePost(req: Request, res: Response): Promise<void>;
    
    // Analytics
    getPostStats(req: Request, res: Response): Promise<void>;
    getPopularHashtags(req: Request, res: Response): Promise<void>;
}