import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IFollowController } from "../../core/interfaces/controllers/community/IFollow.controller";
import { IFollowService } from "../../core/interfaces/services/community/IFollowService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";

@injectable()
export class FollowController implements IFollowController {
    constructor(
        @inject(TYPES.IFollowService) private _followService: IFollowService
    ) { }

    async followUser(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.VALID_USERNAME_REQUIRED
                });
                return;
            }

            const result = await this._followService.followUser(user.id, username.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_FOLLOW_USER;

            logger.error(LoggerMessages.FOLLOW_USER_ERROR, {
                message,
                stack: err.stack,
                userId: req.user ? (req.user as any).id : 'unknown',
                targetUsername: req.body?.username
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async unfollowUser(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.VALID_USERNAME_REQUIRED
                });
                return;
            }

            const result = await this._followService.unfollowUser(user.id, username.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UNFOLLOW_USER;

            logger.error(LoggerMessages.UNFOLLOW_USER_ERROR, {
                message,
                stack: err.stack,
                userId: req.user ? (req.user as any).id : 'unknown',
                targetUsername: req.body?.username
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getFollowers(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!user?.id) {
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

            const result = await this._followService.getFollowers(
                user.id,
                user.id,
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
            const message = err.message || ErrorMessages.FAILED_GET_FOLLOWERS;

            logger.error(LoggerMessages.GET_FOLLOWERS_ERROR, { message, stack: err.stack });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getFollowing(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string } | undefined;
            const { cursor, limit } = req.query;

            if (!user?.id) {
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

            const result = await this._followService.getFollowing(
                user.id,
                user.id,
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
            const message = err.message || ErrorMessages.FAILED_GET_FOLLOWING;

            logger.error(LoggerMessages.GET_FOLLOWING_ERROR, { message, stack: err.stack });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getUserFollowers(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string } | undefined;
            const { username } = req.params;
            const { cursor, limit } = req.query;

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.VALID_USERNAME_REQUIRED
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

            const result = await this._followService.getUserFollowers(
                username.trim(),
                user?.id,
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
            const message = err.message || ErrorMessages.FAILED_GET_USER_FOLLOWERS;

            logger.error(LoggerMessages.GET_USER_FOLLOWERS_ERROR, {
                message,
                stack: err.stack,
                username: req.params.username
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getUserFollowing(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string } | undefined;
            const { username } = req.params;
            const { cursor, limit } = req.query;

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.VALID_USERNAME_REQUIRED
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

            const result = await this._followService.getUserFollowing(
                username.trim(),
                user?.id,
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
            const message = err.message || ErrorMessages.FAILED_GET_USER_FOLLOWING;

            logger.error(LoggerMessages.GET_USER_FOLLOWING_ERROR, {
                message,
                stack: err.stack,
                username: req.params.username
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getFollowStatus(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.params;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.VALID_USERNAME_REQUIRED
                });
                return;
            }

            const result = await this._followService.getFollowStatus(user.id, username.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_FOLLOW_STATUS;

            logger.error(LoggerMessages.GET_FOLLOW_STATUS_ERROR, {
                message,
                stack: err.stack,
                username: req.params.username
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getFollowStats(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: ErrorMessages.USER_NOT_AUTHENTICATED
                });
                return;
            }

            const result = await this._followService.getFollowStats(user.id);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_FOLLOW_STATS;

            logger.error(LoggerMessages.GET_FOLLOW_STATS_ERROR, {
                message,
                stack: err.stack,
                userId: req.user ? (req.user as any).id : 'unknown'
            });

            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}