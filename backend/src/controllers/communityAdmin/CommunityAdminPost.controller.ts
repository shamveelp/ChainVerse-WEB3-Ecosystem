import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import { ICommunityAdminPostController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminPost.controller";
import { ICommunityAdminPostService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminPostService";

@injectable()
export class CommunityAdminPostController implements ICommunityAdminPostController {
    constructor(
        @inject(TYPES.ICommunityAdminPostService) private _postService: ICommunityAdminPostService
    ) {}

    async createPost(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const postData = req.body;

            const post = await this._postService.createPost(adminId, postData);

            res.status(StatusCode.CREATED).json({
                success: true,
                data: post,
                message: "Post created successfully"
            });
        } catch (error) {
            const err = error as Error;
            logger.error("Create community admin post error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to create post";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Get community admin post error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch post";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { postId } = req.params;
            const updateData = req.body;

            const post = await this._postService.updatePost(adminId, postId, updateData);

            res.status(StatusCode.OK).json({
                success: true,
                data: post,
                message: "Post updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            logger.error("Update community admin post error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update post";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Delete community admin post error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete post";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Get community admin posts error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch posts";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Toggle community admin post like error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to toggle post like";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const commentData = req.body;

            const comment = await this._postService.createComment(adminId, commentData);

            res.status(StatusCode.CREATED).json({
                success: true,
                data: comment,
                message: "Comment created successfully"
            });
        } catch (error) {
            const err = error as Error;
            logger.error("Create community admin comment error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to create comment";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Get community admin post comments error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch comments";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Toggle community admin comment like error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id, commentId: req.params.commentId });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to toggle comment like";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async uploadPostMedia(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;

            if (!req.file) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "No file uploaded"
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
                            logger.error("Post media upload error:", error);
                            reject(new CustomError("Failed to upload media", StatusCode.INTERNAL_SERVER_ERROR));
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
                    message: "Media uploaded successfully"
                }
            });
        } catch (error) {
            const err = error as Error;
            logger.error("Upload post media error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to upload media";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

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
            logger.error("Get community members feed error:", { message: err.message, stack: err.stack, adminId: (req as any).user?.id });
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community members feed";
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}