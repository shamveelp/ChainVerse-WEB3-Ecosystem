import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { IUserQuestController } from "../../core/interfaces/controllers/quest/IUserQuest.controller";
import { IUserQuestService } from "../../core/interfaces/services/quest/IUserQuestService";
import {
  GetAvailableQuestsDto,
  JoinQuestDto,
  SubmitTaskDto,
  GetMyQuestsDto
} from "../../dtos/quest/UserQuest.dto";

@injectable()
export class UserQuestController implements IUserQuestController {
  constructor(
    @inject(TYPES.IUserQuestService) private _questService: IUserQuestService
  ) {}

  async getAvailableQuests(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const query: GetAvailableQuestsDto = req.query as any;

      const result = await this._questService.getAvailableQuests(userId, query);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          quests: result.quests,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 12,
            total: result.total,
            pages: result.pages
          }
        },
        message: "Available quests retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get available quests";
      logger.error("Get available quests error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { questId } = req.params;

      const quest = await this._questService.getQuestById(questId, userId);

      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: "Quest retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest";
      logger.error("Get quest error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getMyQuests(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query: GetMyQuestsDto = req.query as any;

      const result = await this._questService.getMyQuests(userId, query);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          quests: result.quests,
          pagination: {
            page: query.page || 1,
            limit: query.limit || 12,
            total: result.total,
            pages: result.pages
          }
        },
        message: "My quests retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get my quests";
      logger.error("Get my quests error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async joinQuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const joinDto: JoinQuestDto = req.body;

      const result = await this._questService.joinQuest(userId, joinDto);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to join quest";
      logger.error("Join quest error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async submitTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const submitDto: SubmitTaskDto = req.body;

      const result = await this._questService.submitTask(userId, submitDto);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: "Task submitted successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to submit task";
      logger.error("Submit task error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { questId } = req.params;

      const tasks = await this._questService.getQuestTasks(questId, userId);

      res.status(StatusCode.OK).json({
        success: true,
        data: tasks,
        message: "Quest tasks retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest tasks";
      logger.error("Get quest tasks error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getMySubmissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { questId } = req.params;

      const submissions = await this._questService.getMySubmissions(userId, questId);

      res.status(StatusCode.OK).json({
        success: true,
        data: submissions,
        message: "Submissions retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get submissions";
      logger.error("Get submissions error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async uploadTaskMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      if (!req.file) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "No file provided"
        });
        return;
      }

      const result = await this._questService.uploadTaskMedia(req.file, userId);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: "Media uploaded successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to upload media";
      logger.error("Upload task media error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestStats(req: Request, res: Response): Promise<void> {
    try {
      const { questId } = req.params;

      const stats = await this._questService.getQuestStats(questId);

      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: "Quest stats retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest stats";
      logger.error("Get quest stats error:", { message, stack: err.stack });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getTopQuests(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const quests = await this._questService.getTopQuests(limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: quests,
        message: "Top quests retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get top quests";
      logger.error("Get top quests error:", { message, stack: err.stack });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async checkParticipationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { questId } = req.params;

      const status = await this._questService.checkParticipationStatus(userId, questId);

      res.status(StatusCode.OK).json({
        success: true,
        data: status,
        message: "Participation status retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to check participation status";
      logger.error("Check participation status error:", { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { questId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const leaderboard = await this._questService.getQuestLeaderboard(questId);

      res.status(StatusCode.OK).json({
        success: true,
        data: leaderboard,
        message: "Quest leaderboard retrieved successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get quest leaderboard";
      logger.error("Get quest leaderboard error:", { message, stack: err.stack });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}