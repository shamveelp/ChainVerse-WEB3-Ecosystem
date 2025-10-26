import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IPostController } from "../../core/interfaces/controllers/posts/IPost.controller";
import { IPostService } from "../../core/interfaces/services/posts/IPostService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import {
    CreatePostDto,
    UpdatePostDto,
    CreateCommentDto,
    SharePostDto
} from "../../dtos/posts/Post.dto";

@injectable()
export class PostController implements IPostController {
    constructor(
        @inject(TYPES.IPostService) private _postService: IPostService
    ) {}

    // Post CRUD operations
    async createPost(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            const { content, mediaUrls, mediaType }: CreatePostDto = req.body;

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post content is required"
                });
                return;
            }

            const postData: CreatePostDto = {
                content: content.trim(),
                mediaUrls: mediaUrls || [],
                mediaType: mediaType || 'none'
            };

            const post = await this._postService.createPost(user.id, postData);

            
            res.status(StatusCode.CREATED).json({
                success: true,
                data: post,
                message: "Post created successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Create post controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to create post";
            logger.error("Create post error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPostById(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            const postDetail = await this._postService.getPostById(postId, user?.id);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: postDetail
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get post by ID controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch post";
            logger.error("Get post by ID error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const user = req.user as { id: string; role: string };
            const { content, mediaUrls }: UpdatePostDto = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post content is required"
                });
                return;
            }

            const updateData: UpdatePostDto = {
                content: content.trim(),
                mediaUrls: mediaUrls || []
            };

            const updatedPost = await this._postService.updatePost(postId, user.id, updateData);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: updatedPost,
                message: "Post updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Update post controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update post";
            logger.error("Update post error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            const result = await this._postService.deletePost(postId, user.id);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Delete post controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete post";
            logger.error("Delete post error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Post queries
    async getFeedPosts(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string };
            const { cursor, limit } = req.query;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.getFeedPosts(
                user.id,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get feed posts controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch feed posts";
            logger.error("Get feed posts error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getUserPosts(req: Request, res: Response): Promise<void> {
        try {
            
            const { userId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!userId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "User ID is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.getUserPosts(
                userId,
                user?.id,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get user posts controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch user posts";
            logger.error("Get user posts error:", { message, stack: err.stack, userId: req.params.userId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getLikedPosts(req: Request, res: Response): Promise<void> {
        try {
            
            const { userId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!userId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "User ID is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.getLikedPosts(
                userId,
                user?.id,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get liked posts controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch liked posts";
            logger.error("Get liked posts error:", { message, stack: err.stack, userId: req.params.userId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getTrendingPosts(req: Request, res: Response): Promise<void> {
        try {
            
            const { cursor, limit } = req.query;

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.getTrendingPosts(
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get trending posts controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch trending posts";
            logger.error("Get trending posts error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPostsByHashtag(req: Request, res: Response): Promise<void> {
        try {
            
            const { hashtag } = req.params;
            const { cursor, limit } = req.query;

            if (!hashtag || hashtag.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Hashtag is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.getPostsByHashtag(
                hashtag.trim(),
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get posts by hashtag controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch posts by hashtag";
            logger.error("Get posts by hashtag error:", { message, stack: err.stack, hashtag: req.params.hashtag });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async searchPosts(req: Request, res: Response): Promise<void> {
        try {
            
            const { q: query, cursor, limit } = req.query;

            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Search query is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 20);
                }
            }

            const posts = await this._postService.searchPosts(
                query.trim(),
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            console.error("Search posts controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to search posts";
            logger.error("Search posts error:", { message, stack: err.stack, query: req.query.q });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Like operations
    async togglePostLike(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            const result = await this._postService.togglePostLike(user.id, postId);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Toggle post like controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to toggle post like";
            logger.error("Toggle post like error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async toggleCommentLike(req: Request, res: Response): Promise<void> {
        try {
            
            const { commentId } = req.params;
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment ID is required"
                });
                return;
            }

            const result = await this._postService.toggleCommentLike(user.id, commentId);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Toggle comment like controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to toggle comment like";
            logger.error("Toggle comment like error:", { message, stack: err.stack, commentId: req.params.commentId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPostLikers(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const { cursor, limit } = req.query;

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 20;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const likers = await this._postService.getPostLikers(
                postId,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: likers
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get post likers controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch post likers";
            logger.error("Get post likers error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Comment operations
    async createComment(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string };
            const { postId, content, parentCommentId }: CreateCommentDto = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!postId || !content) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and content are required"
                });
                return;
            }

            if (content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment content cannot be empty"
                });
                return;
            }

            const commentData: CreateCommentDto = {
                postId,
                content: content.trim(),
                parentCommentId: parentCommentId || undefined
            };

            const comment = await this._postService.createComment(user.id, commentData);

            
            res.status(StatusCode.CREATED).json({
                success: true,
                data: comment,
                message: "Comment created successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Create comment controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to create comment";
            logger.error("Create comment error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateComment(req: Request, res: Response): Promise<void> {
        try {
            
            const { commentId } = req.params;
            const user = req.user as { id: string; role: string };
            const { content } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment ID is required"
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment content is required"
                });
                return;
            }

            const updatedComment = await this._postService.updateComment(commentId, user.id, content.trim());

            
            res.status(StatusCode.OK).json({
                success: true,
                data: updatedComment,
                message: "Comment updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Update comment controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update comment";
            logger.error("Update comment error:", { message, stack: err.stack, commentId: req.params.commentId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async deleteComment(req: Request, res: Response): Promise<void> {
        try {
            
            const { commentId } = req.params;
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment ID is required"
                });
                return;
            }

            const result = await this._postService.deleteComment(commentId, user.id);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Delete comment controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete comment";
            logger.error("Delete comment error:", { message, stack: err.stack, commentId: req.params.commentId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPostComments(req: Request, res: Response): Promise<void> {
        try {
            
            const { postId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const comments = await this._postService.getPostComments(
                postId,
                user?.id,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: comments
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get post comments controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch post comments";
            logger.error("Get post comments error:", { message, stack: err.stack, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommentReplies(req: Request, res: Response): Promise<void> {
        try {
            
            const { commentId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Comment ID is required"
                });
                return;
            }

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const replies = await this._postService.getCommentReplies(
                commentId,
                user?.id,
                cursor as string,
                validLimit
            );

            
            res.status(StatusCode.OK).json({
                success: true,
                data: replies
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get comment replies controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch comment replies";
            logger.error("Get comment replies error:", { message, stack: err.stack, commentId: req.params.commentId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Media operations
    async uploadPostMedia(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "No file uploaded"
                });
                return;
            }

            
            const result = await this._postService.uploadPostMedia(req.file);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Upload post media controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to upload media";
            logger.error("Upload post media error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Share operations
    async sharePost(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string };
            const { postId, shareText }: SharePostDto = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            const shareData: SharePostDto = {
                postId,
                shareText: shareText || undefined
            };

            const result = await this._postService.sharePost(user.id, shareData);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Share post controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to share post";
            logger.error("Share post error:", { message, stack: err.stack, userId: req.user });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Analytics
    async getPostStats(req: Request, res: Response): Promise<void> {
        try {
            
            const user = req.user as { id: string; role: string } | undefined;
            const { userId } = req.query;

            // If userId is provided, use it; otherwise use authenticated user's ID
            const targetUserId = userId as string || user?.id;

            const stats = await this._postService.getPostStats(targetUserId);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: stats
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get post stats controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch post stats";
            logger.error("Get post stats error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPopularHashtags(req: Request, res: Response): Promise<void> {
        try {
            
            const { limit } = req.query;

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const hashtags = await this._postService.getPopularHashtags(validLimit);

            
            res.status(StatusCode.OK).json({
                success: true,
                data: { hashtags }
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get popular hashtags controller error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch popular hashtags";
            logger.error("Get popular hashtags error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}