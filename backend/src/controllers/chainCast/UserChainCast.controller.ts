import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCast.service";
import {
    JoinChainCastDto,
    RequestModerationDto,
    AddReactionDto,
    GetChainCastsQueryDto,
    GetReactionsQueryDto,
    UpdateParticipantDto
} from "../../dtos/chainCast/ChainCast.dto";
import { IUserChainCastController } from "../../core/interfaces/controllers/chainCast/IUserChainCast.controller";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

interface ServiceError extends Error {
    statusCode?: number;
}

@injectable()
export class UserChainCastController implements IUserChainCastController {
    constructor(
        @inject(TYPES.IChainCastService) private _chainCastService: IChainCastService
    ) { }

    /**
     * Retrieves ChainCasts for a specific community.
     * @param req - Express Request object containing community ID and query parameters.
     * @param res - Express Response object.
     */
    async getCommunityChainCasts(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { communityId } = req.params;
            const query = req.query as unknown as GetChainCastsQueryDto;

            const result = await this._chainCastService.getCommunityChainCasts(communityId, userId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_COMMUNITY_CHAINCASTS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_COMMUNITY_CHAINCASTS
            });
        }
    }

    /**
     * Retrieves details of a specific ChainCast.
     * @param req - Express Request object containing ChainCast ID in params.
     * @param res - Express Response object.
     */
    async getChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.getChainCastById(chainCastId, userId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_CHAINCAST
            });
        }
    }

    /**
     * Joins a ChainCast.
     * @param req - Express Request object containing join details in body.
     * @param res - Express Response object.
     */
    async joinChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const joinData: JoinChainCastDto = req.body;

            const result = await this._chainCastService.joinChainCast(userId, joinData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.JOIN_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_JOIN_CHAINCAST
            });
        }
    }

    /**
     * Leaves a ChainCast.
     * @param req - Express Request object containing ChainCast ID in params.
     * @param res - Express Response object.
     */
    async leaveChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.leaveChainCast(userId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.LEAVE_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_LEAVE_CHAINCAST
            });
        }
    }

    /**
     * Updates participant details (e.g., role, status).
     * @param req - Express Request object containing update details.
     * @param res - Express Response object.
     */
    async updateParticipant(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;
            const updateData: UpdateParticipantDto = req.body;

            const result = await this._chainCastService.updateParticipant(chainCastId, userId, updateData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.UPDATE_PARTICIPANT_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_UPDATE_PARTICIPANT
            });
        }
    }

    /**
     * Requests moderation action.
     * @param req - Express Request object containing request details.
     * @param res - Express Response object.
     */
    async requestModeration(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const requestData: RequestModerationDto = req.body;

            const result = await this._chainCastService.requestModeration(userId, requestData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.REQUEST_MODERATION_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_REQUEST_MODERATION
            });
        }
    }

    /**
     * Adds a reaction to a ChainCast item.
     * @param req - Express Request object containing reaction details.
     * @param res - Express Response object.
     */
    async addReaction(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const reactionData: AddReactionDto = req.body;

            const result = await this._chainCastService.addReaction(userId, reactionData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.ADD_REACTION_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_ADD_REACTION
            });
        }
    }

    /**
     * Retrieves reactions on a ChainCast.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async getReactions(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const query: GetReactionsQueryDto = { ...req.query, chainCastId } as unknown as GetReactionsQueryDto;

            const result = await this._chainCastService.getReactions(chainCastId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_REACTIONS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_REACTIONS
            });
        }
    }

    /**
     * Checks if a user has permission to join a ChainCast.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async canJoinChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.canUserJoinChainCast(userId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.CHECK_JOIN_PERMISSIONS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_CHECK_JOIN_PERMISSIONS
            });
        }
    }
}