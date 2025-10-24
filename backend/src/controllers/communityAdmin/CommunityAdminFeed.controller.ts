import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminFeedController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminFeed.controller";
import { ICommunityAdminFeedService } from "../../core/interfaces/services/communityAdmin/ICommnityAdminFeedService";

@injectable()
export class CommunityAdminFeedController implements ICommunityAdminFeedController {
    constructor(
        @inject(TYPES.ICommunityAdminFeedService) private _feedService: ICommunityAdminFeedService
    ) {}

    async getCommunityFeed(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { cursor, limit = '10', type = 'all' } = req.query;

            console.log("Getting community feed for admin:", communityAdminId);

            // Validate limit
            let validLimit = 10;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const feed = await this._feedService.getCommunityFeed(
                communityAdminId,
                cursor as string,
                validLimit,
                type as string
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: feed
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community feed error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community feed";
            logger.error("Get community feed error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async togglePostLike(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;

            console.log("Community admin toggling post like:", communityAdminId, "post:", postId);

            const result = await this._feedService.togglePostLike(communityAdminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Toggle post like error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to toggle post like";
            logger.error("Toggle post like error:", { message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId, content, parentCommentId } = req.body;

            console.log("Community admin creating comment:", communityAdminId, "on post:", postId);

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

            const comment = await this._feedService.createComment(communityAdminId, {
                postId,
                content: content.trim(),
                parentCommentId
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                data: comment,
                message: "Comment created successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Create comment error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to create comment";
            logger.error("Create comment error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async sharePost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;
            const { shareText } = req.body;

            console.log("Community admin sharing post:", communityAdminId, "post:", postId);

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID is required"
                });
                return;
            }

            const result = await this._feedService.sharePost(communityAdminId, postId, shareText);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            console.error("Share post error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to share post";
            logger.error("Share post error:", { message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getEngagementStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            console.log("Getting engagement stats for admin:", communityAdminId, "period:", period);

            const stats = await this._feedService.getEngagementStats(communityAdminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: stats
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get engagement stats error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch engagement stats";
            logger.error("Get engagement stats error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async pinPost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;

            console.log("Community admin pinning post:", postId);

            const result = await this._feedService.pinPost(communityAdminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Post pinned successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Pin post error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to pin post";
            logger.error("Pin post error:", { message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;
            const { reason } = req.body;

            console.log("Community admin deleting post:", postId, "reason:", reason);

            const result = await this._feedService.deletePost(communityAdminId, postId, reason);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Post deleted successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Delete post error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete post";
            logger.error("Delete post error:", { message, stack: err.stack, adminId: (req as any).user?.id, postId: req.params.postId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}