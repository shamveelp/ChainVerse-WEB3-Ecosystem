import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminFeedController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminFeed.controller";
import { ICommunityAdminFeedService } from "../../core/interfaces/services/communityAdmin/ICommnityAdminFeedService";
import { SuccessMessages, ErrorMessages, ValidationMessages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminFeedController implements ICommunityAdminFeedController {
    constructor(
        @inject(TYPES.ICommunityAdminFeedService)
        private _feedService: ICommunityAdminFeedService
    ) {}

    async getCommunityFeed(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { cursor, limit = '10', type = 'all' } = req.query;

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
                message: SuccessMessages.COMMUNITY_FEED_FETCHED,
                data: feed,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_COMMUNITY_FEED;
            logger.error("Get community feed error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async togglePostLike(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;

            const result = await this._feedService.togglePostLike(communityAdminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message || SuccessMessages.POST_LIKE_TOGGLED,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_TOGGLE_POST_LIKE;
            logger.error("Toggle post like error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
                postId: req.params.postId,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId, content, parentCommentId } = req.body;

            if (!postId || !content) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ValidationMessages.MISSING_POST_OR_CONTENT,
                });
                return;
            }

            if (content.trim().length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ValidationMessages.EMPTY_COMMENT_CONTENT,
                });
                return;
            }

            const comment = await this._feedService.createComment(communityAdminId, {
                postId,
                content: content.trim(),
                parentCommentId,
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                data: comment,
                message: SuccessMessages.COMMENT_CREATED,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_CREATE_COMMENT;
            logger.error("Create comment error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async sharePost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;
            const { shareText } = req.body;

            if (!postId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ValidationMessages.MISSING_POST_ID,
                });
                return;
            }

            const result = await this._feedService.sharePost(communityAdminId, postId, shareText);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message || SuccessMessages.POST_SHARED,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_SHARE_POST;
            logger.error("Share post error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
                postId: req.params.postId,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async getEngagementStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            const stats = await this._feedService.getEngagementStats(communityAdminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.ENGAGEMENT_STATS_FETCHED,
                data: stats,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_ENGAGEMENT_STATS;
            logger.error("Get engagement stats error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async pinPost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;

            const result = await this._feedService.pinPost(communityAdminId, postId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: SuccessMessages.POST_PINNED,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_PIN_POST;
            logger.error("Pin post error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
                postId: req.params.postId,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { postId } = req.params;
            const { reason } = req.body;

            const result = await this._feedService.deletePost(communityAdminId, postId, reason);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: SuccessMessages.POST_DELETED,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_POST;
            logger.error("Delete post error:", {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
                postId: req.params.postId,
            });
            res.status(statusCode).json({ success: false, error: message });
        }
    }
}
