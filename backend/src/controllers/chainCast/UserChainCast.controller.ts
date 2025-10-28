import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCastService";
import {
    JoinChainCastDto,
    RequestModerationDto,
    AddReactionDto,
    GetChainCastsQueryDto,
    GetReactionsQueryDto,
    UpdateParticipantDto
} from "../../dtos/chainCast/ChainCast.dto";
import { IUserChainCastController } from "../../core/interfaces/controllers/chainCast/IUserChainCast.controller";


@injectable()
export class UserChainCastController implements IUserChainCastController {
    constructor(
        @inject(TYPES.IChainCastService) private _chainCastService: IChainCastService
    ) {}

    async getCommunityChainCasts(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { communityId } = req.params;
            const query: GetChainCastsQueryDto = req.query as any;

            const result = await this._chainCastService.getCommunityChainCasts(communityId, userId, query);
            
            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error("Get community ChainCasts error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get community ChainCasts"
            });
        }
    }

    async getChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.getChainCastById(chainCastId, userId);
            
            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error("Get ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get ChainCast"
            });
        }
    }

    async joinChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const joinData: JoinChainCastDto = req.body;

            const result = await this._chainCastService.joinChainCast(userId, joinData);
            
            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error("Join ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to join ChainCast"
            });
        }
    }

    async leaveChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.leaveChainCast(userId, chainCastId);
            
            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error("Leave ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to leave ChainCast"
            });
        }
    }

    async updateParticipant(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { chainCastId } = req.params;
            const updateData: UpdateParticipantDto = req.body;

            const result = await this._chainCastService.updateParticipant(chainCastId, userId, updateData);
            
            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error("Update participant error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to update participant"
            });
        }
    }

    async requestModeration(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const requestData: RequestModerationDto = req.body;

            const result = await this._chainCastService.requestModeration(userId, requestData);
            
            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error("Request moderation error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to request moderation"
            });
        }
    }

    async addReaction(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const reactionData: AddReactionDto = req.body;

            const result = await this._chainCastService.addReaction(userId, reactionData);
            
            res.status(StatusCode.OK).json({
                success: true,
                message: result.message,
                data: result
            });
        } catch (error: any) {
            logger.error("Add reaction error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to add reaction"
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
            logger.error("Get reactions error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get reactions"
            });
        }
    }

    async canJoinChainCast(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { chainCastId } = req.params;

            const result = await this._chainCastService.canUserJoinChainCast(userId, chainCastId);
            
            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error("Can join ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to check join permissions"
            });
        }
    }
}