import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCastService";
import {
    CreateChainCastDto,
    UpdateChainCastDto,
    ReviewModerationRequestDto,
    GetChainCastsQueryDto,
    GetParticipantsQueryDto,
    GetReactionsQueryDto
} from "../../dtos/chainCast/ChainCast.dto";
import { ICommunityAdminChainCastController } from "../../core/interfaces/controllers/chainCast/ICommunityAdminChainCast.controller";



@injectable()
export class CommunityAdminChainCastController implements ICommunityAdminChainCastController {
    constructor(
        @inject(TYPES.IChainCastService) private _chainCastService: IChainCastService
    ) { }

    async createChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const createData: CreateChainCastDto = req.body;

            const result = await this._chainCastService.createChainCast(adminId, createData);

            res.status(StatusCode.CREATED).json({
                success: true,
                message: SuccessMessages.CHAINCAST_CREATED,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.CREATE_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_CREATE_CHAINCAST
            });
        }
    }

    async getChainCasts(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const query: GetChainCastsQueryDto = req.query as any;

            const result = await this._chainCastService.getChainCasts(adminId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_CHAINCASTS_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_CHAINCASTS
            });
        }
    }

    async getChainCast(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const adminId = (req as any).user.id;

            const result = await this._chainCastService.getChainCastById(chainCastId, adminId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_CHAINCAST
            });
        }
    }

    async updateChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { chainCastId } = req.params;
            const updateData: UpdateChainCastDto = req.body;

            const result = await this._chainCastService.updateChainCast(adminId, chainCastId, updateData);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_UPDATED,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.UPDATE_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_UPDATE_CHAINCAST
            });
        }
    }

    async deleteChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.deleteChainCast(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.DELETE_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_DELETE_CHAINCAST
            });
        }
    }

    async startChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.startChainCast(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_STARTED,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.START_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_START_CHAINCAST
            });
        }
    }

    async endChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.endChainCast(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.CHAINCAST_ENDED,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.END_CHAINCAST_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_END_CHAINCAST
            });
        }
    }

    async getParticipants(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const query: GetParticipantsQueryDto = { ...req.query, chainCastId } as any;

            const result = await this._chainCastService.getParticipants(chainCastId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_PARTICIPANTS_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_PARTICIPANTS
            });
        }
    }

    async removeParticipant(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
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
        } catch (error: any) {
            logger.error(LoggerMessages.REMOVE_PARTICIPANT_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_REMOVE_PARTICIPANT
            });
        }
    }

    async getModerationRequests(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.getModerationRequests(adminId, chainCastId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_MODERATION_REQUESTS_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_MODERATION_REQUESTS
            });
        }
    }

    async reviewModerationRequest(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const reviewData: ReviewModerationRequestDto = req.body;

            const result = await this._chainCastService.reviewModerationRequest(adminId, reviewData);

            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.REVIEW_MODERATION_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_REVIEW_MODERATION
            });
        }
    }

    async getAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { period } = req.query;

            const result = await this._chainCastService.getChainCastAnalytics(adminId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_ANALYTICS_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_ANALYTICS
            });
        }
    }

    async getReactions(req: Request, res: Response): Promise<void> {
        try {
            const { chainCastId } = req.params;
            const query: GetReactionsQueryDto = { ...req.query, chainCastId } as any;

            const result = await this._chainCastService.getReactions(chainCastId, query);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error(LoggerMessages.GET_REACTIONS_ERROR, error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || ErrorMessages.FAILED_GET_REACTIONS
            });
        }
    }
}