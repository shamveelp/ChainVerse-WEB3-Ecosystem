import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
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
    ) {}

    async createChainCast(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const createData: CreateChainCastDto = req.body;

            const result = await this._chainCastService.createChainCast(adminId, createData);
            
            res.status(StatusCode.CREATED).json({
                success: true,
                message: "ChainCast created successfully",
                data: result
            });
        } catch (error: any) {
            logger.error("Create ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to create ChainCast"
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
            logger.error("Get ChainCasts error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get ChainCasts"
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
            logger.error("Get ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get ChainCast"
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
                message: "ChainCast updated successfully",
                data: result
            });
        } catch (error: any) {
            logger.error("Update ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to update ChainCast"
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
            logger.error("Delete ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to delete ChainCast"
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
                message: "ChainCast started successfully",
                data: result
            });
        } catch (error: any) {
            logger.error("Start ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to start ChainCast"
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
                message: "ChainCast ended successfully",
                data: result
            });
        } catch (error: any) {
            logger.error("End ChainCast error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to end ChainCast"
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
            logger.error("Get participants error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get participants"
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
            logger.error("Remove participant error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to remove participant"
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
            logger.error("Get moderation requests error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get moderation requests"
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
            logger.error("Review moderation request error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to review moderation request"
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
            logger.error("Get ChainCast analytics error:", error);
            res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message || "Failed to get analytics"
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
}