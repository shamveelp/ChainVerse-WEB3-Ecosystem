import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminQuestService } from "../../core/interfaces/services/quest/ICommunityAdminQuest.service";
import {
  CreateQuestDto,
  UpdateQuestDto,
  GetQuestsQueryDto,
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto
} from "../../dtos/quest/CommunityAdminQuest.dto";
import { ICommunityAdminQuestController } from "../../core/interfaces/controllers/quest/ICommunityAdminQuest.controller";
import { validateManualQuestPayload } from "../../validations/questValidation";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class CommunityAdminQuestController implements ICommunityAdminQuestController {
  constructor(
    @inject(TYPES.ICommunityAdminQuestService) private _questService: ICommunityAdminQuestService
  ) { }

  /**
   * Creates a new manual quest.
   * @param req - Express Request object containing quest data.
   * @param res - Express Response object.
   */
  async createQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const createDto: CreateQuestDto = req.body;
      const validatedQuest = validateManualQuestPayload(createDto) as CreateQuestDto;
      const quest = await this._questService.createQuest(communityAdminId, validatedQuest);

      res.status(StatusCode.CREATED).json({
        success: true,
        data: quest,
        message: SuccessMessages.QUEST_CREATED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CREATE_QUEST;

      logger.error(LoggerMessages.CREATE_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questData: req.body
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves a specific quest by ID.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async getQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const quest = await this._questService.getQuestById(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: SuccessMessages.QUEST_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST;

      logger.error(LoggerMessages.GET_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves a list of quests managed by the admin.
   * @param req - Express Request object containing pagination and filter parameters.
   * @param res - Express Response object.
   */
  async getQuests(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const query = req.query as unknown as GetQuestsQueryDto;

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
        message: SuccessMessages.QUESTS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUESTS;

      logger.error(LoggerMessages.GET_QUESTS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        query: req.query
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Updates an existing quest.
   * @param req - Express Request object containing questId in params and update data in body.
   * @param res - Express Response object.
   */
  async updateQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;
      const updateDto: UpdateQuestDto = req.body;

      const quest = await this._questService.updateQuest(questId, communityAdminId, updateDto);

      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: SuccessMessages.QUEST_UPDATED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_UPDATE_QUEST;

      logger.error(LoggerMessages.UPDATE_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId,
        updateData: req.body
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Deletes a quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async deleteQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const deleted = await this._questService.deleteQuest(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: { deleted },
        message: deleted ? SuccessMessages.QUEST_DELETED : ErrorMessages.QUEST_NOT_FOUND
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_DELETE_QUEST;

      logger.error(LoggerMessages.DELETE_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Generates a quest using AI based on a prompt.
   * @param req - Express Request object containing AI generation parameters.
   * @param res - Express Response object.
   */
  async generateQuestWithAI(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const aiDto: AIQuestGenerationDto = req.body;

      const questData = await this._questService.generateQuestWithAI(communityAdminId, aiDto);

      res.status(StatusCode.OK).json({
        success: true,
        data: questData,
        message: SuccessMessages.QUEST_GENERATED_AI
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GENERATE_QUEST_AI;

      logger.error(LoggerMessages.GENERATE_AI_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        aiPrompt: req.body.prompt
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Chats with AI to refine quest details.
   * @param req - Express Request object containing message and history.
   * @param res - Express Response object.
   */
  async chatWithAI(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { message, history } = req.body;

      const result = await this._questService.chatWithAI(communityAdminId, message, history);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.AI_RESPONSE_GENERATED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CHAT_AI;

      logger.error(LoggerMessages.AI_CHAT_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves participants of a quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async getQuestParticipants(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;
      const query = req.query as unknown as GetParticipantsQueryDto;

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
        message: SuccessMessages.PARTICIPANTS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_PARTICIPANTS;

      logger.error(LoggerMessages.GET_PARTICIPANTS_ERROR_LOG, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves details of a specific participant.
   * @param req - Express Request object containing questId and participantId in params.
   * @param res - Express Response object.
   */
  async getParticipantDetails(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId, participantId } = req.params;

      const participant = await this._questService.getParticipantDetails(questId, participantId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: participant,
        message: SuccessMessages.PARTICIPANT_DETAILS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_PARTICIPANT_DETAILS;

      logger.error(LoggerMessages.GET_PARTICIPANT_DETAILS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId,
        participantId: req.params.participantId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Selects winners for a quest manually.
   * @param req - Express Request object containing selection details.
   * @param res - Express Response object.
   */
  async selectWinners(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const selectDto: SelectWinnersDto = req.body;

      const result = await this._questService.selectWinners(communityAdminId, selectDto);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: `${result.message} 🏆`
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_SELECT_WINNERS;

      logger.error(LoggerMessages.SELECT_WINNERS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.body.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Selects replacement winners if needed.
   * @param req - Express Request object containing questId in params and count in body.
   * @param res - Express Response object.
   */
  async selectReplacementWinners(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;
      const { count } = req.body;

      const result = await this._questService.selectReplacementWinners(questId, communityAdminId, count || 1);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: `${result.message} 🔄`
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_SELECT_REPLACEMENT_WINNERS;

      logger.error(LoggerMessages.SELECT_REPLACEMENT_WINNERS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Disqualifies a participant from a quest.
   * @param req - Express Request object containing questId, participantId in params and reason in body.
   * @param res - Express Response object.
   */
  async disqualifyParticipant(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId, participantId } = req.params;
      const { reason } = req.body;

      const disqualified = await this._questService.disqualifyParticipant(questId, participantId, reason, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: { disqualified },
        message: disqualified ? SuccessMessages.PARTICIPANT_DISQUALIFIED : ErrorMessages.FAILED_DISQUALIFY_PARTICIPANT
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_DISQUALIFY_PARTICIPANT;

      logger.error(LoggerMessages.DISQUALIFY_PARTICIPANT_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId,
        participantId: req.params.participantId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Distributes rewards to quest winners.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async distributeRewards(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const result = await this._questService.distributeRewards(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: `${result.message} 💰`
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_DISTRIBUTE_REWARDS;

      logger.error(LoggerMessages.DISTRIBUTE_REWARDS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves statistics for a specific quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async getQuestStats(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const stats = await this._questService.getQuestStats(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: SuccessMessages.QUEST_STATS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST_STATS;

      logger.error(LoggerMessages.GET_QUEST_STATS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves overall community quest statistics.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getCommunityQuestStats(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const stats = await this._questService.getCommunityQuestStats(communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: stats,
        message: SuccessMessages.COMMUNITY_QUEST_STATS_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_COMMUNITY_QUEST_STATS;

      logger.error(LoggerMessages.GET_COMMUNITY_QUEST_STATS_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Starts a quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async startQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const quest = await this._questService.startQuest(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: SuccessMessages.QUEST_STARTED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_START_QUEST;

      logger.error(LoggerMessages.START_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Ends a quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async endQuest(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const quest = await this._questService.endQuest(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: quest,
        message: SuccessMessages.QUEST_ENDED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_END_QUEST;

      logger.error(LoggerMessages.END_QUEST_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Uploads a banner image for a quest.
   * @param req - Express Request object containing file.
   * @param res - Express Response object.
   */
  async uploadQuestBanner(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      if (!req.file) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.NO_BANNER_IMAGE_PROVIDED
        });
        return;
      }

      const result = await this._questService.uploadQuestBanner(questId, req.file, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.QUEST_BANNER_UPLOADED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_UPLOAD_QUEST_BANNER;

      logger.error(LoggerMessages.UPLOAD_QUEST_BANNER_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the leaderboard for a quest.
   * @param req - Express Request object containing questId in params.
   * @param res - Express Response object.
   */
  async getQuestLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as AuthenticatedRequest).user?.id;
      if (!communityAdminId) throw new Error("User ID not found in request");

      const { questId } = req.params;

      const leaderboard = await this._questService.getQuestLeaderboard(questId, communityAdminId);

      res.status(StatusCode.OK).json({
        success: true,
        data: leaderboard,
        message: SuccessMessages.QUEST_LEADERBOARD_RETRIEVED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_QUEST_LEADERBOARD;

      logger.error(LoggerMessages.GET_QUEST_LEADERBOARD_ERROR, {
        message,
        stack: err.stack,
        adminId: (req as AuthenticatedRequest).user?.id,
        questId: req.params.questId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}