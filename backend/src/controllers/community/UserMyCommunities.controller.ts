import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserMyCommunitiesController } from "../../core/interfaces/controllers/community/IUserMyCommunities.controller";
import { IUserMyCommunitiesService } from "../../core/interfaces/services/community/IUserMyCommunitiesService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class UserMyCommunitiesController implements IUserMyCommunitiesController {
    constructor(
        @inject(TYPES.IUserMyCommunitiesService) private _userMyCommunitiesService: IUserMyCommunitiesService
    ) {}

    async getMyCommunities(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { cursor, limit, filter, sortBy } = req.query;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
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
            const message = err.message || "Failed to get my communities";
            logger.error("Get my communities error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMyCommunitiesStats(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
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
            const message = err.message || "Failed to get communities stats";
            logger.error("Get communities stats error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMyCommunitiesActivity(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
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
            const message = err.message || "Failed to get communities activity";
            logger.error("Get communities activity error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateCommunityNotifications(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityId, enabled } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!communityId || typeof enabled !== 'boolean') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community ID and notification status are required"
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
                message: `Notifications ${enabled ? 'enabled' : 'disabled'} for community`
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update notifications";
            logger.error("Update community notifications error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async leaveCommunityFromMy(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityId } = req.params;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!communityId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community ID is required"
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
            const message = err.message || "Failed to leave community";
            logger.error("Leave community error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}