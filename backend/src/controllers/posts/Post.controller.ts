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
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class PostController implements IPostController {
    constructor(
        @inject(TYPES.IPostService) private _postService: IPostService
    ) { }

    // Post CRUD operations
    async createPost(req: Request, res: Response): Promise<void> {
        try {

            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            const { content, mediaUrls, mediaType }: CreatePostDto = req.body;

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_CONTENT_REQUIRED
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
                message: SuccessMessages.POST_CREATED
            });
        } catch (error) {
            const err = error as Error;

            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_CREATE_POST;
            logger.error(LoggerMessages.CREATE_POST_ERROR, { message, stack: err.stack, userId: req.user });
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
                    error: ErrorMessages.POST_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_POST;
            logger.error(LoggerMessages.GET_POST_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_ID_REQUIRED
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_CONTENT_REQUIRED
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
                message: SuccessMessages.POST_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_POST;
            logger.error(LoggerMessages.UPDATE_POST_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_POST;
            logger.error(LoggerMessages.DELETE_POST_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_FEED_POSTS;
            logger.error(LoggerMessages.GET_FEED_POSTS_ERROR, { message, stack: err.stack });
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
                    error: ErrorMessages.USER_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_USER_POSTS;
            logger.error(LoggerMessages.GET_USER_POSTS_ERROR, { message, stack: err.stack, userId: req.params.userId });
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
                    error: ErrorMessages.USER_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_LIKED_POSTS;
            logger.error(LoggerMessages.GET_LIKED_POSTS_ERROR, { message, stack: err.stack, userId: req.params.userId });
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_TRENDING_POSTS;
            logger.error(LoggerMessages.GET_TRENDING_POSTS_ERROR, { message, stack: err.stack });
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
                    error: ErrorMessages.HASHTAG_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_POSTS_HASHTAG;
            logger.error(LoggerMessages.GET_POSTS_HASHTAG_ERROR, { message, stack: err.stack, hashtag: req.params.hashtag });
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
                    error: ErrorMessages.SEARCH_QUERY_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_SEARCH_POSTS;
            logger.error(LoggerMessages.SEARCH_POSTS_ERROR, { message, stack: err.stack, query: req.query.q });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_TOGGLE_POST_LIKE;
            logger.error(LoggerMessages.TOGGLE_POST_LIKE_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMENT_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_TOGGLE_COMMENT_LIKE;
            logger.error(LoggerMessages.TOGGLE_COMMENT_LIKE_ERROR, { message, stack: err.stack, commentId: req.params.commentId });
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
                    error: ErrorMessages.POST_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FETCH_POST_LIKERS;
            logger.error(LoggerMessages.GET_POST_LIKERS_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!postId || !content) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_ID_CONTENT_REQUIRED
                });
                return;
            }

            if (content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMENT_CONTENT_EMPTY
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
                message: SuccessMessages.COMMENT_CREATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_CREATE_COMMENT;
            logger.error(LoggerMessages.CREATE_COMMENT_ERROR, { message, stack: err.stack, userId: req.user });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMENT_ID_REQUIRED
                });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMENT_CONTENT_REQUIRED
                });
                return;
            }

            const updatedComment = await this._postService.updateComment(commentId, user.id, content.trim());


            res.status(StatusCode.OK).json({
                success: true,
                data: updatedComment,
                message: SuccessMessages.MESSAGE_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_COMMENT;
            logger.error(LoggerMessages.UPDATE_COMMENT_ERROR, { message, stack: err.stack, commentId: req.params.commentId });
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!commentId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMENT_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_COMMENT;
            logger.error(LoggerMessages.DELETE_COMMENT_ERROR, { message, stack: err.stack, commentId: req.params.commentId });
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
                    error: ErrorMessages.POST_ID_REQUIRED
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
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_POST_COMMENTS;
            logger.error(LoggerMessages.GET_POST_COMMENTS_ERROR, { message, stack: err.stack, postId: req.params.postId });
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
                    error: ErrorMessages.COMMENT_ID_REQUIRED
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
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
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.POST_ID_REQUIRED
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