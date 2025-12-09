import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserMyCommunitiesController } from "../../core/interfaces/controllers/community/IUserMyCommunities.controller";
import { IUserMyCommunitiesService } from "../../core/interfaces/services/community/IUserMyCommunitiesService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";

@injectable()
export class UserMyCommunitiesController implements IUserMyCommunitiesController {
    constructor(
        @inject(TYPES.IUserMyCommunitiesService) private _userMyCommunitiesService: IUserMyCommunitiesService
    ) { }

    /**
     * Retrieves a list of communities the user has joined or created.
     * @param req - Express Request object containing pagination, filter, and sort parameters.
     * @param res - Express Response object.
     */
    async getMyCommunities(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { cursor, limit, filter, sortBy } = req.query;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
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

            const filterType = (filter as string) || 'all';
            const sortType = (sortBy as string) || 'recent';

            const result = await this._userMyCommunitiesService.getMyCommunities(
                user.id,
                filterType,
                sortType,
                cursor as string,
                validLimit
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_MY_COMMUNITIES;
            logger.error(LoggerMessages.GET_MY_COMMUNITIES_ERROR, { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves statistics about the user's communities (e.g., total joined, created).
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getMyCommunitiesStats(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            const result = await this._userMyCommunitiesService.getMyCommunitiesStats(user.id);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_COMMUNITIES_STATS;
            logger.error(LoggerMessages.GET_COMMUNITIES_STATS_ERROR, { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Retrieves recent activity from the user's communities.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getMyCommunitiesActivity(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            const result = await this._userMyCommunitiesService.getMyCommunitiesActivity(user.id);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_COMMUNITIES_ACTIVITY;
            logger.error(LoggerMessages.GET_COMMUNITIES_ACTIVITY_ERROR, { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Updates notification settings for a specific community.
     * @param req - Express Request object containing communityId and enabled status in body.
     * @param res - Express Response object.
     */
    async updateCommunityNotifications(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityId, enabled } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!communityId || typeof enabled !== 'boolean') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMUNITY_ID_NOTIFICATION_REQUIRED
                });
                return;
            }

            const result = await this._userMyCommunitiesService.updateCommunityNotifications(
                user.id,
                communityId,
                enabled
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: { notificationsEnabled: result },
                message: `${SuccessMessages.NOTIFICATIONS_UPDATED}: ${enabled ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_NOTIFICATIONS;
            logger.error(LoggerMessages.UPDATE_COMMUNITY_NOTIFICATIONS_ERROR, { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    /**
     * Leaves a community directly from the "My Communities" list.
     * @param req - Express Request object containing communityId in params.
     * @param res - Express Response object.
     */
    async leaveCommunityFromMy(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityId } = req.params;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!communityId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.COMMUNITY_ID_REQUIRED
                });
                return;
            }

            const result = await this._userMyCommunitiesService.leaveCommunity(user.id, communityId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_LEAVE_COMMUNITY;
            logger.error(LoggerMessages.LEAVE_COMMUNITY_ERROR, { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}