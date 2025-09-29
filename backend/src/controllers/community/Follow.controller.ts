import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IFollowController } from "../../core/interfaces/controllers/community/IFollow.controller";
import { IFollowService } from "../../core/interfaces/services/community/IFollowService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class FollowController implements IFollowController {
    constructor(
        @inject(TYPES.IFollowService) private _followService: IFollowService
    ) {}

    async followUser(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._followService.followUser(user.id, username);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to follow user";
            logger.error("Follow user error:", { message, stack: err.stack, userId: req.user });
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
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._followService.unfollowUser(user.id, username);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to unfollow user";
            logger.error("Unfollow user error:", { message, stack: err.stack, userId: req.user });
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

            const result = await this._followService.getFollowers(
                user?.id || '',
                user?.id,
                cursor as string,
                limit ? parseInt(limit as string, 10) : 20
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get followers";
            logger.error("Get followers error:", { message, stack: err.stack });
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

            const result = await this._followService.getFollowing(
                user?.id || '',
                user?.id,
                cursor as string,
                limit ? parseInt(limit as string, 10) : 20
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get following";
            logger.error("Get following error:", { message, stack: err.stack });
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

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._followService.getUserFollowers(
                username,
                user?.id,
                cursor as string,
                limit ? parseInt(limit as string, 10) : 20
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get user followers";
            logger.error("Get user followers error:", { message, stack: err.stack });
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

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._followService.getUserFollowing(
                username,
                user?.id,
                cursor as string,
                limit ? parseInt(limit as string, 10) : 20
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get user following";
            logger.error("Get user following error:", { message, stack: err.stack });
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
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Username is required"
                });
                return;
            }

            const result = await this._followService.getFollowStatus(user.id, username);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get follow status";
            logger.error("Get follow status error:", { message, stack: err.stack });
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
                    error: "User not authenticated"
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
            const message = err.message || "Failed to get follow stats";
            logger.error("Get follow stats error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}