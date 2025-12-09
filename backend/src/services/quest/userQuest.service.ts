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
  GetLeaderboardDto
} from "../../dtos/quest/UserQuest.dto";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import mongoose from "mongoose";

@injectable()
export class UserQuestService implements IUserQuestService {
  constructor(
    @inject(TYPES.IUserQuestRepository) private _questRepository: IUserQuestRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) { }

  async getAvailableQuests(userId: string, query: GetAvailableQuestsDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }> {
    try {
      const { page = 1, limit = 12, status = 'active', search, communityId, sortBy = 'createdAt', sortOrder = 'desc', rewardType } = query;

      const filters: any = { status };
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
      logger.error("Get available quests error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get available quests", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestById(questId: string, userId?: string): Promise<QuestResponseDto> {
    try {
      const quest = await this._questRepository.findQuestById(questId);
      if (!quest) {
        throw new CustomError("Quest not found", StatusCode.NOT_FOUND);
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
      logger.error("Get quest by ID error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getMyQuests(userId: string, query: GetMyQuestsDto): Promise<{ quests: MyQuestResponseDto[]; total: number; pages: number }> {
    try {
      const { page = 1, limit = 12, status, search } = query;

      const { quests: myQuests, total } = await this._questRepository.findMyQuests(userId, page, limit, status);

      const questResponses = myQuests.map(quest => new MyQuestResponseDto(quest));

      const pages = Math.ceil(total / limit);
      return { quests: questResponses, total, pages };
    } catch (error) {
      logger.error("Get my quests error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get my quests", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async joinQuest(userId: string, joinDto: JoinQuestDto): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      const quest = await this._questRepository.findQuestById(joinDto.questId);
      if (!quest) {
        throw new CustomError("Quest not found", StatusCode.NOT_FOUND);
      }

      // Enhanced validation
      if (quest.status !== 'active') {
        let message = "Quest is not available for joining";
        if (quest.status === 'ended') message = "This quest has already ended";
        if (quest.status === 'draft') message = "This quest is still in draft mode";
        if (quest.status === 'cancelled') message = "This quest has been cancelled";
        throw new CustomError(message, StatusCode.BAD_REQUEST);
      }

      // Check if quest has started and not ended
      const now = new Date();
      const startDate = new Date(quest.startDate);
      const endDate = new Date(quest.endDate);

      if (startDate > now) {
        throw new CustomError("Quest hasn't started yet", StatusCode.BAD_REQUEST);
      }

      if (endDate <= now) {
        throw new CustomError("Quest has already ended", StatusCode.BAD_REQUEST);
      }

      if (quest.totalParticipants >= quest.participantLimit) {
        throw new CustomError("Quest is full - maximum participants reached", StatusCode.BAD_REQUEST);
      }

      // Check if user is already participating
      const existingParticipation = await this._questRepository.findParticipantByUserAndQuest(userId, joinDto.questId);
      if (existingParticipation) {
        throw new CustomError("You are already participating in this quest", StatusCode.BAD_REQUEST);
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

      logger.info(`User joined quest successfully`, { userId, questId: joinDto.questId });
      return { 
        success: true, 
        message: `Successfully joined "${quest.title}"! You can now start completing tasks to earn rewards.` 
      };
    } catch (error) {
      logger.error("Join quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to join quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitTask(userId: string, submitDto: SubmitTaskDto): Promise<TaskSubmissionResponseDto> {
    try {
      // Verify user participation
      const participation = await this._questRepository.findParticipantByUserAndQuest(userId, submitDto.questId);
      if (!participation) {
        throw new CustomError("You are not participating in this quest", StatusCode.BAD_REQUEST);
      }

      if (participation.status === 'disqualified') {
        throw new CustomError("You have been disqualified from this quest", StatusCode.BAD_REQUEST);
      }

      // Check if task already submitted
      const existingSubmission = await this._questRepository.findSubmissionByUserTaskQuest(userId, submitDto.taskId, submitDto.questId);
      if (existingSubmission) {
        throw new CustomError("You have already submitted this task", StatusCode.BAD_REQUEST);
      }

      // Validate submission data based on task type
      const validationResult = await this._questRepository.validateTaskSubmission(submitDto.taskId, submitDto.submissionData);
      if (!validationResult.valid) {
        throw new CustomError(validationResult.message || "Invalid submission data", StatusCode.BAD_REQUEST);
      }

      // Get quest to check if it's still active
      const quest = await this._questRepository.findQuestById(submitDto.questId);
      if (!quest || quest.status !== 'active') {
        throw new CustomError("Quest is not active for task submissions", StatusCode.BAD_REQUEST);
      }

      // Check if quest has ended
      const now = new Date();
      if (new Date(quest.endDate) <= now) {
        throw new CustomError("Quest has ended - no more submissions allowed", StatusCode.BAD_REQUEST);
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

      const updateData: any = {
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

      logger.info(`Task submitted successfully`, { userId, questId: submitDto.questId, taskId: submitDto.taskId });
      
      const response = new TaskSubmissionResponseDto(submission);
      response.message = `Task "${completedTask?.title}" submitted successfully! ${
        updateData.status === 'completed' 
          ? "🎉 Congratulations! You've completed all tasks in this quest."
          : `Progress: ${updatedTasksCompleted}/${totalTasks.length} tasks completed.`
      }`;
      
      return response;
    } catch (error) {
      logger.error("Submit task error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to submit task", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestTasks(questId: string, userId: string): Promise<any[]> {
    try {
      const tasks = await this._questRepository.findTasksByQuest(questId);
      const submissions = await this._questRepository.findSubmissionsByUserAndQuest(userId, questId);

      // Mark tasks as completed if user has submitted them
      const tasksWithStatus = tasks.map(task => {
        const submission = submissions.find(sub => {
          const subTaskId = (sub.taskId as any)._id || sub.taskId;
          return subTaskId.toString() === task._id.toString();
        });
        
        return {
          ...task,
          isCompleted: !!submission,
          submission: submission || null,
          canSubmit: !submission // Can submit if no existing submission
        };
      });

      return tasksWithStatus;
    } catch (error) {
      logger.error("Get quest tasks error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest tasks", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getMySubmissions(userId: string, questId: string): Promise<any[]> {
    try {
      const submissions = await this._questRepository.findSubmissionsByUserAndQuest(userId, questId);
      return submissions;
    } catch (error) {
      logger.error("Get my submissions error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get submissions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestStats(questId: string): Promise<any> {
    try {
      const stats = await this._questRepository.getQuestParticipantStats(questId);
      const taskStats = await this._questRepository.getTaskCompletionStats(questId);
      
      return {
        ...stats,
        taskCompletionStats: taskStats
      };
    } catch (error) {
      logger.error("Get quest stats error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest stats", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTopQuests(limit: number = 10): Promise<QuestResponseDto[]> {
    try {
      const quests = await this._questRepository.findTopQuests(limit);
      return quests.map(quest => new QuestResponseDto(quest));
    } catch (error) {
      logger.error("Get top quests error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get top quests", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkParticipationStatus(userId: string, questId: string): Promise<any> {
    try {
      const participation = await this._questRepository.findParticipantByUserAndQuest(userId, questId);
      if (!participation) {
        return { 
          isParticipating: false,
          canJoin: true,
          message: "You haven't joined this quest yet" 
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
        status: participation.status,
        joinedAt: participation.joinedAt,
        completedAt: participation.completedAt,
        totalTasksCompleted: participation.totalTasksCompleted,
        totalPrivilegePoints: participation.totalPrivilegePoints,
        isWinner: participation.isWinner,
        rewardClaimed: participation.rewardClaimed,
        rank: rank
      };
    } catch (error) {
      logger.error("Check participation status error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to check participation status", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestLeaderboard(questId: string, query: GetLeaderboardDto): Promise<LeaderboardResponseDto> {
    try {
      const { page = 1, limit = 10 } = query;

      // Check if quest supports leaderboard
      const supportsLeaderboard = await this._questRepository.questSupportsLeaderboard(questId);
      if (!supportsLeaderboard) {
        return new LeaderboardResponseDto({
          participants: [],
          pagination: { page, limit, total: 0, pages: 0 },
          message: "This quest doesn't use leaderboard-based selection"
        });
      }

      const { participants, total, pages } = await this._questRepository.getQuestLeaderboard(questId, page, limit);
      
      return new LeaderboardResponseDto({
        participants,
        pagination: { page, limit, total, pages }
      });
    } catch (error) {
      logger.error("Get quest leaderboard error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest leaderboard", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

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
      logger.error("Upload task media error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to upload media", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}