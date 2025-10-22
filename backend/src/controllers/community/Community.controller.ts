import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { ICommunityController } from "../../core/interfaces/controllers/community/ICommunity.controller";
import { ICommunityService } from "../../core/interfaces/services/community/ICommunityService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class CommunityController implements ICommunityController {
    constructor(
        @inject(TYPES.ICommunityService) private _communityService: ICommunityService
    ) {}

    async getCommunityById(req: Request, res: Response): Promise<void> {
        try {
            const { communityId } = req.params;
            const user = req.user as { id: string; role: string } | undefined;

            if (!communityId) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community ID is required"
                });
                return;
            }

            const community = await this._communityService.getCommunityById(communityId, user?.id);

            if (!community) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Community not found"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                data: community
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community";
            logger.error("Get community by ID error:", { message, stack: err.stack, communityId: req.params.communityId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommunityByUsername(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const user = req.user as { id: string; role: string } | undefined;

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community username is required"
                });
                return;
            }

            const community = await this._communityService.getCommunityByUsername(username.trim(), user?.id);

            if (!community) {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Community not found"
                });
                return;
            }

            res.status(StatusCode.OK).json({
                success: true,
                data: community
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community";
            logger.error("Get community by username error:", { message, stack: err.stack, username: req.params.username });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async searchCommunities(req: Request, res: Response): Promise<void> {
        try {
            const { query, type, cursor, limit } = req.query;
            const user = req.user as { id: string; role: string } | undefined;

            if (!query || typeof query !== 'string' || query.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Search query is required"
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

            const searchType = type as string || 'all';
            const result = await this._communityService.searchCommunities(
                query.trim(),
                searchType,
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
            const message = err.message || "Failed to search communities";
            logger.error("Search communities error:", { message, stack: err.stack, query: req.query.query });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getPopularCommunities(req: Request, res: Response): Promise<void> {
        try {
            const { cursor, limit, category } = req.query;
            const user = req.user as { id: string; role: string } | undefined;

            // Validate limit
            let validLimit = 20;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const result = await this._communityService.getPopularCommunities(
                user?.id,
                cursor as string,
                validLimit,
                category as string
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get popular communities";
            logger.error("Get popular communities error:", { message, stack: err.stack });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async joinCommunity(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityUsername } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Valid community username is required"
                });
                return;
            }

            const result = await this._communityService.joinCommunity(user.id, communityUsername.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to join community";
            logger.error("Join community error:", { 
                message, 
                stack: err.stack, 
                userId: req.user ? (req.user as any).id : 'unknown',
                communityUsername: req.body?.communityUsername
            });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async leaveCommunity(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityUsername } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!communityUsername || typeof communityUsername !== 'string' || communityUsername.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Valid community username is required"
                });
                return;
            }

            const result = await this._communityService.leaveCommunity(user.id, communityUsername.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to leave community";
            logger.error("Leave community error:", { 
                message, 
                stack: err.stack, 
                userId: req.user ? (req.user as any).id : 'unknown',
                communityUsername: req.body?.communityUsername
            });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommunityMembers(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const { cursor, limit } = req.query;
            const user = req.user as { id: string; role: string } | undefined;

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Valid community username is required"
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

            const result = await this._communityService.getCommunityMembers(
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
            const message = err.message || "Failed to get community members";
            logger.error("Get community members error:", {
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

    async getCommunityMemberStatus(req: Request, res: Response): Promise<void> {
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

            if (!username || typeof username !== 'string' || username.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Valid community username is required"
                });
                return;
            }

            const result = await this._communityService.getCommunityMemberStatus(user.id, username.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get member status";
            logger.error("Get community member status error:", {
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
}