import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import { ICommunityAdminPostController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminPost.controller";
import { ICommunityAdminPostService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminPostService";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminPostController implements ICommunityAdminPostController {
    constructor(
        @inject(TYPES.ICommunityAdminPostService) private _postService: ICommunityAdminPostService
    ) { }

    /**
     * Creates a new post in the community.
     * @param req - Express Request object containing post data in body.
     * @param res - Express Response object.
     */
    async createPost(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const postData = req.body;

            const post = await this._postService.createPost(adminId, postData);

            res.status(StatusCode.CREATED).json({
                success: true,
                data: post,
                message: SuccessMessages.POST_CREATED
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.CREATE_POST_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_CREATE_POST;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves a post by its ID.
     * @param req - Express Request object containing postId in params.
     * @param res - Express Response object.
     */
    async getPostById(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;

            const post = await this._postService.getPostById(adminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: post
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.GET_POST_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_POST;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Updates an existing post.
     * @param req - Express Request object containing postId in params and update data in body.
     * @param res - Express Response object.
     */
    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;
            const updateData = req.body;

            const post = await this._postService.updatePost(adminId, postId, updateData);

            res.status(StatusCode.OK).json({
                success: true,
                data: post,
                message: SuccessMessages.POST_UPDATED
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.UPDATE_POST_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_POST;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Deletes a post.
     * @param req - Express Request object containing postId in params.
     * @param res - Express Response object.
     */
    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;

            const result = await this._postService.deletePost(adminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.DELETE_POST_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_POST;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves posts managed by the admin with filters.
     * @param req - Express Request object containing query parameters.
     * @param res - Express Response object.
     */
    async getAdminPosts(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const query = req.query;

            const posts = await this._postService.getAdminPosts(adminId, query as any);

            res.status(StatusCode.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.GET_POSTS_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_POSTS;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Toggles a like on a post.
     * @param req - Express Request object containing postId in params.
     * @param res - Express Response object.
     */
    async togglePostLike(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;

            const result = await this._postService.togglePostLike(adminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.TOGGLE_POST_LIKE_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_TOGGLE_POST_LIKE;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Creates a comment on a post.
     * @param req - Express Request object containing comment data in body.
     * @param res - Express Response object.
     */
    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const commentData = req.body;

            const comment = await this._postService.createComment(adminId, commentData);

            res.status(StatusCode.CREATED).json({
                success: true,
                data: comment,
                message: SuccessMessages.COMMENT_CREATED
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.CREATE_COMMENT_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_CREATE_COMMENT;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves comments for a specific post.
     * @param req - Express Request object containing postId in params and pagination parameters.
     * @param res - Express Response object.
     */
    async getPostComments(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;
            const { cursor, limit = '10' } = req.query;

            const validLimit = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50);

            const result = await this._postService.getPostComments(adminId, postId, cursor as string, validLimit);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.GET_COMMENTS_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_POST_COMMENTS;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Toggles a like on a comment.
     * @param req - Express Request object containing commentId in params.
     * @param res - Express Response object.
     */
    async toggleCommentLike(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { commentId } = req.params;

            const result = await this._postService.toggleCommentLike(adminId, commentId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.TOGGLE_COMMENT_LIKE_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id, commentId: req.params.commentId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_TOGGLE_COMMENT_LIKE;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Uploads media files for a post.
     * @param req - Express Request object containing file.
     * @param res - Express Response object.
     */
    async uploadPostMedia(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_FILE_UPLOADED
                });
                return;
            }

            const result = await new Promise<any>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "chainverse/community-admin-posts",
                        resource_type: "auto",
                        transformation: [
                            { width: 800, height: 800, crop: "limit" },
                            { quality: "auto", format: "auto" },
                        ],
                    },
                    (error, result) => {
                        if (error) {
                            logger.error(LoggerMessages.CLOUDINARY_UPLOAD_ERROR, error);
                            reject(new CustomError(ErrorMessages.MEDIA_UPLOAD_FAILED, StatusCode.INTERNAL_SERVER_ERROR));
                        } else {
                            resolve(result);
                        }
                    }
                ).end(req.file!.buffer);
            });

            const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

            res.status(StatusCode.OK).json({
                success: true,
                data: {
                    mediaUrl: result.secure_url,
                    mediaType,
                    message: SuccessMessages.MEDIA_UPLOADED
                }
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.UPLOAD_MEDIA_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.MEDIA_UPLOAD_FAILED;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves the feed for community members.
     * @param req - Express Request object containing pagination parameters.
     * @param res - Express Response object.
     */
    async getCommunityMembersFeed(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { cursor, limit = '10' } = req.query;

            const validLimit = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 20);

            const feed = await this._postService.getCommunityMembersFeed(adminId, cursor as string, validLimit);

            res.status(StatusCode.OK).json({
                success: true,
                data: feed
            });
        } catch (error) {
            const err = error as Error;
            logger.error(LoggerMessages.FETCH_FEED_ERROR, { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_COMMUNITY_MEMBERS_FEED;
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}