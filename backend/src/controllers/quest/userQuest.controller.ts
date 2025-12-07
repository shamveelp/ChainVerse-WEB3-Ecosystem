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
  GetMyQuestsDto,
  GetLeaderboardDto
} from "../../dtos/quest/UserQuest.dto";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class UserQuestController implements IUserQuestController {
  constructor(
    @inject(TYPES.IUserQuestService) private _questService: IUserQuestService
  ) { }

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
        message: SuccessMessages.AVAILABLE_QUESTS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_AVAILABLE_QUESTS;
      logger.error(LoggerMessages.GET_AVAILABLE_QUESTS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: SuccessMessages.QUEST_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST;
      logger.error(LoggerMessages.GET_QUEST_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: SuccessMessages.MY_QUESTS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_MY_QUESTS;
      logger.error(LoggerMessages.GET_MY_QUESTS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
      const message = err.message || ErrorMessages.FAILED_JOIN_QUEST;
      logger.error(LoggerMessages.JOIN_QUEST_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: result.message || SuccessMessages.TASK_SUBMITTED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_SUBMIT_TASK;
      logger.error(LoggerMessages.SUBMIT_TASK_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: SuccessMessages.QUEST_TASKS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST_TASKS;
      logger.error(LoggerMessages.GET_QUEST_TASKS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: SuccessMessages.SUBMISSIONS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_SUBMISSIONS;
      logger.error(LoggerMessages.GET_SUBMISSIONS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
          error: ErrorMessages.NO_FILE_PROVIDED
        });
        return;
      }

      const result = await this._questService.uploadTaskMedia(req.file, userId);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.MEDIA_UPLOADED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_UPLOAD_MEDIA;
      logger.error(LoggerMessages.UPLOAD_TASK_MEDIA_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
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
        message: SuccessMessages.QUEST_STATS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST_STATS;
      logger.error(LoggerMessages.GET_QUEST_STATS_ERROR, { message, stack: err.stack });
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
        message: SuccessMessages.TOP_QUESTS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_TOP_QUESTS;
      logger.error(LoggerMessages.GET_TOP_QUESTS_ERROR, { message, stack: err.stack });
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
        message: SuccessMessages.PARTICIPATION_STATUS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CHECK_PARTICIPATION_STATUS;
      logger.error(LoggerMessages.CHECK_PARTICIPATION_STATUS_ERROR, { message, stack: err.stack, userId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getQuestLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { questId } = req.params;
      const query: GetLeaderboardDto = req.query as any;

      const leaderboard = await this._questService.getQuestLeaderboard(questId, query);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          participants: leaderboard.participants,
          pagination: leaderboard.pagination
        },
        message: leaderboard.message || SuccessMessages.QUEST_LEADERBOARD_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST_LEADERBOARD;
      logger.error(LoggerMessages.GET_QUEST_LEADERBOARD_ERROR, { message, stack: err.stack });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}