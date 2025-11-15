import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminQuestService } from "../../core/interfaces/services/quest/ICommunityAdminQuestService";
import { 
  CreateQuestDto, 
  UpdateQuestDto, 
  GetQuestsQueryDto, 
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto
} from "../../dtos/quest/CommunityAdminQuest.dto";
import { ICommunityAdminQuestController } from "../../core/interfaces/controllers/quest/ICommunityAdminQuest.controller";



@injectable()
export class CommunityAdminQuestController implements ICommunityAdminQuestController {
  constructor(
    @inject(TYPES.ICommunityAdminQuestService) private _questService: ICommunityAdminQuestService
  ) {}

  async createQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const createDto: CreateQuestDto = req.body;
      console.log("Ivde und")
      const quest = await this._questService.createQuest(communityAdminId, createDto);
      console.log("Ivde illa")
      
      res.status(StatusCode.CREATED).json({
        success: true,
        data: quest,
        message: "Quest created successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to create quest";
      logger.error("Create quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      const quest = await this._questService.getQuestById(questId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: "Quest retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest";
      logger.error("Get quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuests(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const query: GetQuestsQueryDto = req.query as any;
      
      const result = await this._questService.getQuests(communityAdminId, query);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: {
          quests: result.quests,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 10,
            total: result.total,
            pages: result.pages
          }
        },
        message: "Quests retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quests";
      logger.error("Get quests error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async updateQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      const updateDto: UpdateQuestDto = req.body;
      
      const quest = await this._questService.updateQuest(questId, communityAdminId, updateDto);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: "Quest updated successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to update quest";
      logger.error("Update quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async deleteQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      const deleted = await this._questService.deleteQuest(questId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: { deleted },
        message: "Quest deleted successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to delete quest";
      logger.error("Delete quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async generateQuestWithAI(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const aiDto: AIQuestGenerationDto = req.body;
      
      const questData = await this._questService.generateQuestWithAI(communityAdminId, aiDto);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: questData,
        message: "Quest generated with AI successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to generate quest with AI";
      logger.error("Generate AI quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestParticipants(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      const query: GetParticipantsQueryDto = req.query as any;
      
      const result = await this._questService.getQuestParticipants(questId, communityAdminId, query);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: {
          participants: result.participants,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 10,
            total: result.total,
            pages: result.pages
          }
        },
        message: "Participants retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get participants";
      logger.error("Get participants error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getParticipantDetails(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId, participantId } = req.params;
      
      const participant = await this._questService.getParticipantDetails(questId, participantId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: participant,
        message: "Participant details retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get participant details";
      logger.error("Get participant details error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async selectWinners(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const selectDto: SelectWinnersDto = req.body;
      
      const result = await this._questService.selectWinners(communityAdminId, selectDto);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to select winners";
      logger.error("Select winners error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async disqualifyParticipant(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId, participantId } = req.params;
      const { reason } = req.body;
      
      const disqualified = await this._questService.disqualifyParticipant(questId, participantId, reason, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: { disqualified },
        message: "Participant disqualified successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to disqualify participant";
      logger.error("Disqualify participant error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestStats(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      const stats = await this._questService.getQuestStats(questId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: "Quest stats retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest stats";
      logger.error("Get quest stats error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getCommunityQuestStats(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      
      const stats = await this._questService.getCommunityQuestStats(communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: "Community quest stats retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get community quest stats";
      logger.error("Get community quest stats error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async startQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      const quest = await this._questService.startQuest(questId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: "Quest started successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to start quest";
      logger.error("Start quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async endQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      const quest = await this._questService.endQuest(questId, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: "Quest ended successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to end quest";
      logger.error("End quest error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async uploadQuestBanner(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const { questId } = req.params;
      
      if (!req.file) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "No file provided"
        });
        return;
      }
      
      const result = await this._questService.uploadQuestBanner(questId, req.file, communityAdminId);
      
      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: "Quest banner uploaded successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to upload quest banner";
      logger.error("Upload quest banner error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}