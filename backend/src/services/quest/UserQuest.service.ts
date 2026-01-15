import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IUserQuestService } from "../../core/interfaces/services/quest/IUserQuest.service";
import { IUserQuestRepository } from "../../core/interfaces/repositories/quest/IUserQuest.repository";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import {
  GetAvailableQuestsDto,
  JoinQuestDto,
  SubmitTaskDto,
  GetMyQuestsDto,
  QuestResponseDto,
  MyQuestResponseDto,
  TaskSubmissionResponseDto,
  LeaderboardResponseDto,
  GetLeaderboardDto,
  QuestTaskStatusDto,
  ParticipationStatusResponseDto
} from "../../dtos/quest/UserQuest.dto";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages, ValidationMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import mongoose from "mongoose";

import { IQuestTask } from "../../models/questTask.model";
import { IQuestSubmission } from "../../models/questSubmission.model";
import { IQuestParticipant } from "../../models/questParticipant.model";

@injectable()
export class UserQuestService implements IUserQuestService {
  constructor(
    @inject(TYPES.IUserQuestRepository) private _questRepository: IUserQuestRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) { }

  /**
   * Retrieves available quests based on filters.
   * @param {string} userId - ID of the user (optional).
   * @param {GetAvailableQuestsDto} query - Query parameters.
   * @returns {Promise<{ quests: QuestResponseDto[]; total: number; pages: number }>} List of available quests.
   */
  async getAvailableQuests(userId: string, query: GetAvailableQuestsDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }> {
    try {
      const { page = 1, limit = 12, status = 'active', search, communityId, sortBy = 'createdAt', sortOrder = 'desc', rewardType } = query;

      const filters: Record<string, unknown> = { status };
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (communityId) filters.communityId = new mongoose.Types.ObjectId(communityId);
      if (rewardType) filters['rewardPool.rewardType'] = rewardType;

      const { quests, total } = await this._questRepository.findAvailableQuests(page, limit, {
        ...filters,
        sortBy,
        sortOrder
      });

      // Check participation status for each quest if user is authenticated
      const questResponses = await Promise.all(quests.map(async (quest) => {
        let isParticipating = false;
        let participationData = null;

        if (userId) {
          const participation = await this._questRepository.findParticipantByUserAndQuest(userId, quest._id.toString());
          if (participation) {
            isParticipating = true;
            participationData = participation;
          }
        }

        return new QuestResponseDto(quest, isParticipating, participationData);
      }));

      const pages = Math.ceil(total / limit);
      return { quests: questResponses, total, pages };
    } catch (error) {
      logger.error(LoggerMessages.GET_QUESTS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_AVAILABLE_QUESTS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a quest by its ID.
   * @param {string} questId - ID of the quest.
   * @param {string} userId - ID of the user (optional).
   * @returns {Promise<QuestResponseDto>} Quest details.
   */
  async getQuestById(questId: string, userId?: string): Promise<QuestResponseDto> {
    try {
      const quest = await this._questRepository.findQuestById(questId);
      if (!quest) {
        throw new CustomError(ErrorMessages.QUEST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Get quest tasks
      const tasks = await this._questRepository.findTasksByQuest(questId);

      let isParticipating = false;
      let participationData = null;

      if (userId) {
        const participation = await this._questRepository.findParticipantByUserAndQuest(userId, questId);
        if (participation) {
          isParticipating = true;
          participationData = participation;
        }
      }

      const questResponse = new QuestResponseDto(quest, isParticipating, participationData);
      questResponse.tasks = tasks;

      return questResponse;
    } catch (error) {
      logger.error(LoggerMessages.GET_QUEST_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_QUEST, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves quests that the user is participating in.
   * @param {string} userId - ID of the user.
   * @param {GetMyQuestsDto} query - Query parameters.
   * @returns {Promise<{ quests: MyQuestResponseDto[]; total: number; pages: number }>} List of user's quests.
   */
  async getMyQuests(userId: string, query: GetMyQuestsDto): Promise<{ quests: MyQuestResponseDto[]; total: number; pages: number }> {
    try {
      const { page = 1, limit = 12, status, search } = query;

      const { quests: myQuests, total } = await this._questRepository.findMyQuests(userId, page, limit, status);

      const questResponses = myQuests.map(quest => new MyQuestResponseDto(quest));

      const pages = Math.ceil(total / limit);
      return { quests: questResponses, total, pages };
    } catch (error) {
      logger.error(LoggerMessages.GET_MY_QUESTS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_MY_QUESTS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async joinQuest(userId: string, joinDto: JoinQuestDto): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const quest = await this._questRepository.findQuestById(joinDto.questId);
      if (!quest) {
        throw new CustomError(ErrorMessages.QUEST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Enhanced validation
      if (quest.status !== 'active') {
        let message = ErrorMessages.QUEST_NOT_AVAILABLE_JOIN;
        if (quest.status === 'ended') message = ErrorMessages.QUEST_ALREADY_ENDED;
        if (quest.status === 'draft') message = ErrorMessages.QUEST_IS_DRAFT;
        if (quest.status === 'cancelled') message = ErrorMessages.QUEST_CANCELLED;
        throw new CustomError(message, StatusCode.BAD_REQUEST);
      }

      // Check if quest has started and not ended
      const now = new Date();
      const startDate = new Date(quest.startDate);
      const endDate = new Date(quest.endDate);

      if (startDate > now) {
        throw new CustomError(ErrorMessages.QUEST_NOT_STARTED, StatusCode.BAD_REQUEST);
      }

      if (endDate <= now) {
        throw new CustomError(ErrorMessages.QUEST_ALREADY_ENDED, StatusCode.BAD_REQUEST);
      }

      // Note: participantLimit represents winner limit, not total participant cap
      // Unlimited users can participate; only winner selection is limited

      // Check if user is already participating
      const existingParticipation = await this._questRepository.findParticipantByUserAndQuest(userId, joinDto.questId);
      if (existingParticipation) {
        throw new CustomError(ErrorMessages.ALREADY_PARTICIPATING, StatusCode.BAD_REQUEST);
      }

      // Create participation record
      const participantData = {
        questId: new mongoose.Types.ObjectId(joinDto.questId),
        userId: new mongoose.Types.ObjectId(userId),
        walletAddress: joinDto.walletAddress,
        status: 'registered' as const,
        joinedAt: new Date(),
        completedTasks: [],
        totalTasksCompleted: 0,
        totalPrivilegePoints: 0,
        isWinner: false,
        rewardClaimed: false
      };

      await this._questRepository.createParticipant(participantData);
      await this._questRepository.incrementQuestParticipants(joinDto.questId);

      logger.info(SuccessMessages.QUEST_JOINED, { userId, questId: joinDto.questId });
      return {
        success: true,
        message: `Successfully joined "${quest.title}"! You can now start completing tasks to earn rewards.`
      };
    } catch (error) {
      logger.error(LoggerMessages.JOIN_QUEST_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_JOIN_QUEST, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitTask(userId: string, submitDto: SubmitTaskDto): Promise<TaskSubmissionResponseDto> {
    try {
      // Verify user participation
      const participation = await this._questRepository.findParticipantByUserAndQuest(userId, submitDto.questId);
      if (!participation) {
        throw new CustomError(ErrorMessages.NOT_PARTICIPATING, StatusCode.BAD_REQUEST);
      }

      if (participation.status === 'disqualified') {
        throw new CustomError(ErrorMessages.PARTICIPANT_DISQUALIFIED_ERROR, StatusCode.BAD_REQUEST);
      }

      // Check if task already submitted
      const existingSubmission = await this._questRepository.findSubmissionByUserTaskQuest(userId, submitDto.taskId, submitDto.questId);
      if (existingSubmission) {
        throw new CustomError(ErrorMessages.TASK_ALREADY_SUBMITTED, StatusCode.BAD_REQUEST);
      }

      // Validate submission data based on task type
      const validationResult = await this._questRepository.validateTaskSubmission(submitDto.taskId, submitDto.submissionData);
      if (!validationResult.valid) {
        throw new CustomError(validationResult.message || ErrorMessages.INVALID_SUBMISSION_DATA, StatusCode.BAD_REQUEST);
      }

      // Get quest to check if it's still active
      const quest = await this._questRepository.findQuestById(submitDto.questId);
      if (!quest || quest.status !== 'active') {
        throw new CustomError(ErrorMessages.QUEST_NOT_ACTIVE, StatusCode.BAD_REQUEST);
      }

      // Check if quest has ended
      const now = new Date();
      if (new Date(quest.endDate) <= now) {
        throw new CustomError(ErrorMessages.QUEST_ENDED_NO_SUBMISSIONS, StatusCode.BAD_REQUEST);
      }

      // Create submission
      const submissionData = {
        questId: new mongoose.Types.ObjectId(submitDto.questId),
        taskId: new mongoose.Types.ObjectId(submitDto.taskId),
        userId: new mongoose.Types.ObjectId(userId),
        submissionData: submitDto.submissionData,
        status: 'pending' as const,
        submittedAt: new Date()
      };

      const submission = await this._questRepository.createSubmission(submissionData);

      // Update participation status and task completion
      const updatedTasksCompleted = participation.totalTasksCompleted + 1;
      const totalTasks = await this._questRepository.findTasksByQuest(submitDto.questId);

      const updateData: Record<string, unknown> = {
        status: updatedTasksCompleted >= totalTasks.length ? 'completed' : 'in_progress',
        totalTasksCompleted: updatedTasksCompleted,
        completedTasks: [...(participation.completedTasks || []), new mongoose.Types.ObjectId(submitDto.taskId)]
      };

      if (updateData.status === 'completed') {
        updateData.completedAt = new Date();
      }

      await this._questRepository.updateParticipant(participation._id.toString(), updateData);
      await this._questRepository.incrementTaskCompletions(submitDto.taskId);

      // Update privilege points for leaderboard quests
      if (quest.selectionMethod === 'leaderboard') {
        await this._questRepository.updateParticipantPrivilegePoints(participation._id.toString(), submitDto.questId);
      }

      // Get task info for success message
      const tasks = await this._questRepository.findTasksByQuest(submitDto.questId);
      const completedTask = tasks.find(t => t._id.toString() === submitDto.taskId);

      logger.info(SuccessMessages.TASK_SUBMITTED, { userId, questId: submitDto.questId, taskId: submitDto.taskId });

      const response = new TaskSubmissionResponseDto(submission);
      response.message = `Task "${completedTask?.title}" submitted successfully! ${updateData.status === 'completed'
        ? "🎉 Congratulations! You've completed all tasks in this quest."
        : `Progress: ${updatedTasksCompleted}/${totalTasks.length} tasks completed.`
        }`;

      return response;
    } catch (error) {
      logger.error(LoggerMessages.SUBMIT_TASK_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_SUBMIT_TASK, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestTasks(questId: string, userId: string): Promise<QuestTaskStatusDto[]> {
    try {
      const tasks = await this._questRepository.findTasksByQuest(questId);
      const submissions = await this._questRepository.findSubmissionsByUserAndQuest(userId, questId);

      // Mark tasks as completed if user has submitted them
      const tasksWithStatus = tasks.map(task => {
        const submission = submissions.find(sub => {
          const subTaskId = sub.taskId;
          return subTaskId.toString() === task._id.toString();
        });

        return {
          ...task.toObject(),
          isCompleted: !!submission,
          submission: submission || null,
          canSubmit: !submission // Can submit if no existing submission
        };
      });

      return tasksWithStatus as unknown as QuestTaskStatusDto[];
    } catch (error) {
      logger.error(LoggerMessages.GET_QUEST_TASKS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_QUEST_TASKS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @param userId 
   * @param questId 
   * @returns 
   */
  async getMySubmissions(userId: string, questId: string): Promise<IQuestSubmission[]> {
    try {
      const submissions = await this._questRepository.findSubmissionsByUserAndQuest(userId, questId);
      return submissions;
    } catch (error) {
      logger.error(LoggerMessages.GET_SUBMISSIONS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_SUBMISSIONS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestStats(questId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    taskCompletionStats: Array<{
      taskId: string;
      completedBy: number;
      totalParticipants: number;
      completionRate: number;
    }>
  }> {
    try {
      const stats = await this._questRepository.getQuestParticipantStats(questId);
      const taskStats = await this._questRepository.getTaskCompletionStats(questId);

      return {
        totalParticipants: stats.totalParticipants,
        totalSubmissions: stats.totalSubmissions,
        taskCompletionStats: taskStats.map(ts => ({
          taskId: ts.taskId.toString(),
          completedBy: ts.completedBy,
          totalParticipants: ts.totalParticipants,
          completionRate: ts.completionRate
        }))
      };
    } catch (error) {
      logger.error(LoggerMessages.GET_QUEST_STATS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_QUEST_STATS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves top quests.
   * @param {number} limit - Number of quests to retrieve.
   * @returns {Promise<QuestResponseDto[]>} List of top quests.
   */
  async getTopQuests(limit: number = 10): Promise<QuestResponseDto[]> {
    try {
      const quests = await this._questRepository.findTopQuests(limit);
      return quests.map(quest => new QuestResponseDto(quest));
    } catch (error) {
      logger.error(LoggerMessages.GET_TOP_QUESTS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_TOP_QUESTS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @param userId 
   * @param questId 
   * @returns 
   */
  async checkParticipationStatus(userId: string, questId: string): Promise<ParticipationStatusResponseDto> {
    try {
      const participation = await this._questRepository.findParticipantByUserAndQuest(userId, questId);
      if (!participation) {
        return {
          isParticipating: false,
          canJoin: true,
          message: SuccessMessages.QUEST_NOT_JOINED_MSG
        };
      }

      // Get user's rank if quest supports leaderboard
      let rank = null;
      const supportsLeaderboard = await this._questRepository.questSupportsLeaderboard(questId);
      if (supportsLeaderboard) {
        rank = await this._questRepository.getUserRank(userId, questId);
      }

      return {
        isParticipating: true,
        participation,
        rank,
        canJoin: false,
        message: SuccessMessages.QUEST_JOINED
      };
    } catch (error) {
      logger.error(LoggerMessages.CHECK_PARTICIPATION_STATUS_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_CHECK_PARTICIPATION_STATUS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves leaderboard for a quest.
   * @param {string} questId - ID of the quest.
   * @param {GetLeaderboardDto} query - Query parameters.
   * @returns {Promise<LeaderboardResponseDto>} Leaderboard data.
   */
  async getQuestLeaderboard(questId: string, query: GetLeaderboardDto): Promise<LeaderboardResponseDto> {
    try {
      const { page = 1, limit = 10 } = query;

      // Check if quest supports leaderboard
      const supportsLeaderboard = await this._questRepository.questSupportsLeaderboard(questId);
      if (!supportsLeaderboard) {
        return new LeaderboardResponseDto({
          participants: [],
          pagination: { page, limit, total: 0, pages: 0 },
          message: SuccessMessages.NO_LEADERBOARD_MSG
        });
      }

      const { participants, total, pages } = await this._questRepository.getQuestLeaderboard(questId, page, limit);

      return new LeaderboardResponseDto({
        participants,
        pagination: { page, limit, total, pages }
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_QUEST_LEADERBOARD_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_QUEST_LEADERBOARD, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Uploads media for a task submission.
   * @param {Express.Multer.File} file - Media file.
   * @param {string} userId - ID of the user.
   * @returns {Promise<{ mediaUrl: string }>} Uploaded media URL.
   */
  async uploadTaskMedia(file: Express.Multer.File, userId: string): Promise<{ mediaUrl: string }> {
    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'quest-submissions',
          public_id: `submission_${userId}_${Date.now()}`,
          overwrite: true,
          resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          transformation: file.mimetype.startsWith('image/') ? [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
          ] : []
        }
      );

      return { mediaUrl: uploadResult.secure_url };
    } catch (error) {
      logger.error(LoggerMessages.UPLOAD_TASK_MEDIA_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_UPLOAD_MEDIA, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}