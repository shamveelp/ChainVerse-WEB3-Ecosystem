import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { Server } from "socket.io";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCast.service";
import {
    CreateChainCastDto,
    UpdateChainCastDto,
    ReviewModerationRequestDto,
    GetChainCastsQueryDto,
    GetParticipantsQueryDto,
    GetReactionsQueryDto
} from "../../dtos/chainCast/ChainCast.dto";
import { ICommunityAdminChainCastController } from "../../core/interfaces/controllers/chainCast/ICommunityAdminChainCast.controller";
import { notifyCommunityMembers } from "../../socket/communitySocketHandlers";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

interface ServiceError extends Error {
    statusCode?: number;
}

@injectable()
export class CommunityAdminChainCastController implements ICommunityAdminChainCastController {
    constructor(
        @inject(TYPES.IChainCastService) private _chainCastService: IChainCastService
    ) { }

    /**
     * Creates a new ChainCast.
     * @param req - Express Request object containing ChainCast details.
     * @param res - Express Response object.
     */
    async createChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const createData: CreateChainCastDto = req.body;

            const result = await this._chainCastService.createChainCast(adminId, createData);

            res.status(StatusCode.CREATED).json({
                success: true,
                message: SuccessMessages.CHAINCAST_CREATED,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.CREATE_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_CREATE_CHAINCAST
            });
        }
    }

    /**
     * Retrieves a list of ChainCasts managed by the admin.
     * @param req - Express Request object containing query parameters.
     * @param res - Express Response object.
     */
    async getChainCasts(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const query = req.query as unknown as GetChainCastsQueryDto;

            const result = await this._chainCastService.getChainCasts(adminId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_CHAINCASTS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_CHAINCASTS
            });
        }
    }

    /**
     * Retrieves details of a specific ChainCast.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async getChainCast(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const result = await this._chainCastService.getChainCastById(chainCastId, adminId);

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
     * Updates an existing ChainCast.
     * @param req - Express Request object containing update details.
     * @param res - Express Response object.
     */
    async updateChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;
            const updateData: UpdateChainCastDto = req.body;

            const result = await this._chainCastService.updateChainCast(adminId, chainCastId, updateData);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_UPDATED,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.UPDATE_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_UPDATE_CHAINCAST
            });
        }
    }

    /**
     * Deletes a ChainCast.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async deleteChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.deleteChainCast(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.DELETE_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_DELETE_CHAINCAST
            });
        }
    }

    /**
     * Starts a ChainCast session.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async startChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.startChainCast(adminId, chainCastId);

            // Notify community members about chaincast start
            const io = req.app.get('io') as Server;
            if (io && result.communityId) {
                notifyCommunityMembers(io, result.communityId, {
                    type: 'chaincast_started',
                    title: 'ChainCast Live!',
                    message: `${result.title} is now live!`,
                    link: `/user/chaincast/${chainCastId}`,
                    communityId: result.communityId,
                    chainCastId: chainCastId
                });
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_STARTED,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.START_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_START_CHAINCAST
            });
        }
    }

    /**
     * Ends a ChainCast session.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async endChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.endChainCast(adminId, chainCastId);

            // Emit socket event to notify all participants that chaincast has ended
            const io = req.app.get('io') as Server;
            if (io) {
                io.of('/chaincast').to(`chaincast:${chainCastId}`).emit('chaincast_ended', {
                    adminId,
                    timestamp: new Date()
                });
                logger.info('ChainCast ended event emitted', { chainCastId });
            }

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_ENDED,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.END_CHAINCAST_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_END_CHAINCAST
            });
        }
    }

    /**
     * Retrieves the list of participants in a ChainCast.
     * @param req - Express Request object containing ChainCast ID and query parameters.
     * @param res - Express Response object.
     */
    async getParticipants(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const query = { ...req.query, chainCastId } as unknown as GetParticipantsQueryDto;

            const result = await this._chainCastService.getParticipants(chainCastId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_PARTICIPANTS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_PARTICIPANTS
            });
        }
    }

    /**
     * Removes a participant from a ChainCast.
     * @param req - Express Request object containing participant ID and reason.
     * @param res - Express Response object.
     */
    async removeParticipant(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId, participantId } = req.params;
            const { reason } = req.body;

            const result = await this._chainCastService.removeParticipant(
                adminId,
                chainCastId,
                participantId,
                reason
            );

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.REMOVE_PARTICIPANT_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_REMOVE_PARTICIPANT
            });
        }
    }

    /**
     * Retrieves moderation requests for a ChainCast.
     * @param req - Express Request object containing ChainCast ID.
     * @param res - Express Response object.
     */
    async getModerationRequests(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { chainCastId } = req.params;

            const result = await this._chainCastService.getModerationRequests(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_MODERATION_REQUESTS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_MODERATION_REQUESTS
            });
        }
    }

    /**
     * Reviews a moderation request.
     * @param req - Express Request object containing review decision.
     * @param res - Express Response object.
     */
    async reviewModerationRequest(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const reviewData: ReviewModerationRequestDto = req.body;

            const result = await this._chainCastService.reviewModerationRequest(adminId, reviewData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.REVIEW_MODERATION_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_REVIEW_MODERATION
            });
        }
    }

    /**
     * Retrieves analytics data for ChainCasts.
     * @param req - Express Request object containing period query parameter.
     * @param res - Express Response object.
     */
    async getAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user?.id;
            if (!adminId) throw new Error("User ID not found in request");

            const { period } = req.query;

            const result = await this._chainCastService.getChainCastAnalytics(adminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as ServiceError;
            logger.error(LoggerMessages.GET_ANALYTICS_ERROR, error);
            res.status(err.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message || ErrorMessages.FAILED_GET_ANALYTICS
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
            const query = { ...req.query, chainCastId } as unknown as GetReactionsQueryDto;

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
}