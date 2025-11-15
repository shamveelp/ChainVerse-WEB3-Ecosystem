import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminQuestService } from "../../core/interfaces/services/quest/ICommunityAdminQuestService";
import { ICommunityAdminQuestRepository } from "../../core/interfaces/repositories/quest/ICommunityAdminQuestRepository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { 
  CreateQuestDto, 
  UpdateQuestDto, 
  GetQuestsQueryDto, 
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto,
  QuestResponseDto,
  QuestStatsResponseDto
} from "../../dtos/quest/CommunityAdminQuest.dto";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { geminiModel } from "../../config/geminiClient";
import cloudinary from "../../config/cloudinary";
import logger from "../../utils/logger";
import mongoose from "mongoose";
import { IQuestTask } from "../../models/questTask.model";

@injectable()
export class CommunityAdminQuestService implements ICommunityAdminQuestService {
  constructor(
    @inject(TYPES.ICommunityAdminQuestRepository) private _questRepository: ICommunityAdminQuestRepository,
    @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
    @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
  ) {}

  async createQuest(communityAdminId: string, createDto: CreateQuestDto): Promise<QuestResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      // Validate dates
      if (new Date(createDto.startDate) <= new Date()) {
        throw new CustomError("Start date must be in the future", StatusCode.BAD_REQUEST);
      }

      if (new Date(createDto.endDate) <= new Date(createDto.startDate)) {
        throw new CustomError("End date must be after start date", StatusCode.BAD_REQUEST);
      }

      // Create quest with tasks
      const questData = {
        ...createDto,
        communityId: new mongoose.Types.ObjectId(admin.communityId.toString()),
        communityAdminId: new mongoose.Types.ObjectId(communityAdminId),
        status: 'draft' as const,
        totalParticipants: 0,
        totalSubmissions: 0,
        winnersSelected: false
      };

      const quest = await this._questRepository.createQuest(questData);

      // Create quest tasks
      if (createDto.tasks && createDto.tasks.length > 0) {
        for (const taskDto of createDto.tasks) {
          const taskData = {
            ...taskDto,
            questId: quest._id,
            completedBy: 0
          };
          await this._questRepository.createQuestTask(taskData as Partial<IQuestTask>);
        }
      }

      // Get quest with tasks for response
      const questWithTasks = await this.getQuestById(quest._id.toString(), communityAdminId);
      
      logger.info(`Quest created successfully`, { questId: quest._id, adminId: communityAdminId });
      return questWithTasks;
    } catch (error) {
      logger.error("Create quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to create quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestById(questId: string, communityAdminId: string): Promise<QuestResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin) {
        throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
      }

      const quest = await this._questRepository.findQuestById(questId);
      if (!quest) {
        throw new CustomError("Quest not found", StatusCode.NOT_FOUND);
      }

      // Ensure admin can only access their community's quests
      // Handle both populated and unpopulated communityId
      let questCommunityId: string;
      if (quest.communityId && typeof quest.communityId === 'object' && '_id' in quest.communityId) {
        // communityId is populated (object with _id)
        questCommunityId = (quest.communityId as any)._id.toString();
      } else {
        // communityId is an ObjectId
        questCommunityId = (quest.communityId as mongoose.Types.ObjectId).toString();
      }
      
      const adminCommunityId = admin.communityId?.toString();
      
      if (!adminCommunityId || questCommunityId !== adminCommunityId) {
        throw new CustomError("Access denied", StatusCode.FORBIDDEN);
      }

      // Get quest tasks
      const tasks = await this._questRepository.findTasksByQuest(questId);
      
      const questResponse = new QuestResponseDto(quest);
      questResponse.tasks = tasks;

      return questResponse;
    } catch (error) {
      logger.error("Get quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuests(communityAdminId: string, query: GetQuestsQueryDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const { page = 1, limit = 10, status } = query;
      const { quests, total } = await this._questRepository.findQuestsByCommunity(
        admin.communityId.toString(),
        page,
        limit,
        status
      );

      const questResponses = quests.map(quest => new QuestResponseDto(quest));
      const pages = Math.ceil(total / limit);

      return { quests: questResponses, total, pages };
    } catch (error) {
      logger.error("Get quests error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quests", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateQuest(questId: string, communityAdminId: string, updateDto: UpdateQuestDto): Promise<QuestResponseDto> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);
      
      // Don't allow editing active or ended quests
      if (['active', 'ended'].includes(quest.status)) {
        throw new CustomError("Cannot edit active or ended quests", StatusCode.BAD_REQUEST);
      }

      // Validate dates if provided
      if (updateDto.startDate && new Date(updateDto.startDate) <= new Date()) {
        throw new CustomError("Start date must be in the future", StatusCode.BAD_REQUEST);
      }

      if (updateDto.endDate && updateDto.startDate) {
        if (new Date(updateDto.endDate) <= new Date(updateDto.startDate)) {
          throw new CustomError("End date must be after start date", StatusCode.BAD_REQUEST);
        }
      }

      const updatedQuest = await this._questRepository.updateQuest(questId, updateDto);
      if (!updatedQuest) {
        throw new CustomError("Failed to update quest", StatusCode.INTERNAL_SERVER_ERROR);
      }

      // Update tasks if provided
      if (updateDto.tasks) {
        // Delete existing tasks
        await this._questRepository.deleteTasksByQuest(questId);
        
        // Create new tasks
        for (const taskDto of updateDto.tasks) {
          const taskData = {
            ...taskDto,
            questId: new mongoose.Types.ObjectId(questId),
            completedBy: 0
          };
          await this._questRepository.createQuestTask(taskData as Partial<IQuestTask>);
        }
      }

      logger.info(`Quest updated successfully`, { questId, adminId: communityAdminId });
      return await this.getQuestById(questId, communityAdminId);
    } catch (error) {
      logger.error("Update quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to update quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteQuest(questId: string, communityAdminId: string): Promise<boolean> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);
      
      // Don't allow deleting active quests
      if (quest.status === 'active') {
        throw new CustomError("Cannot delete active quests", StatusCode.BAD_REQUEST);
      }

      // Delete related data
      await this._questRepository.deleteTasksByQuest(questId);
      const deleted = await this._questRepository.deleteQuest(questId);

      logger.info(`Quest deleted successfully`, { questId, adminId: communityAdminId });
      return deleted;
    } catch (error) {
      logger.error("Delete quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to delete quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async generateQuestWithAI(communityAdminId: string, aiDto: AIQuestGenerationDto): Promise<CreateQuestDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const community = await this._communityRepository.findById(admin.communityId.toString());
      if (!community) {
        throw new CustomError("Community not found", StatusCode.NOT_FOUND);
      }

      const prompt = `
        Create a detailed quest for a Web3 community with the following specifications:
        
        Community Name: ${community.communityName}
        Community Description: ${community.description}
        Community Theme: ${aiDto.communityTheme || 'General Web3'}
        Target Audience: ${aiDto.targetAudience || 'Crypto enthusiasts'}
        Difficulty: ${aiDto.difficulty || 'medium'}
        Expected Winners: ${aiDto.expectedWinners || 10}
        
        User Request: ${aiDto.prompt}
        
        Please generate a quest with:
        1. A compelling title (max 200 characters)
        2. An engaging description (max 2000 characters)
        3. Appropriate start and end dates (start: 2 days from now, duration: 7 days)
        4. Selection method (fcfs or random)
        5. Participant limit (winners)
        6. Reward pool with appropriate currency and type
        7. 3-5 relevant tasks with proper task types and configurations
        
        Available task types: join_community, follow_user, twitter_post, upload_screenshot, nft_mint, token_hold, wallet_connect, custom
        
        Return ONLY a valid JSON object matching this structure:
        {
          "title": "string",
          "description": "string",
          "startDate": "2024-12-27T10:00:00.000Z",
          "endDate": "2025-01-03T10:00:00.000Z",
          "selectionMethod": "random",
          "participantLimit": 10,
          "rewardPool": {
            "amount": 100,
            "currency": "USDT",
            "rewardType": "token"
          },
          "tasks": [
            {
              "title": "Task Title",
              "description": "Task description",
              "taskType": "join_community",
              "isRequired": true,
              "order": 1,
              "config": {}
            }
          ],
          "isAIGenerated": true,
          "aiPrompt": "${aiDto.prompt}"
        }
      `;

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in AI response");
        }

        const questData = JSON.parse(jsonMatch[0]);
        
        // Validate and set default values
        const now = new Date();
        const startDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days duration

        const aiQuest: CreateQuestDto = {
          title: questData.title || "AI Generated Quest",
          description: questData.description || "An exciting quest generated by AI",
          startDate: startDate,
          endDate: endDate,
          selectionMethod: questData.selectionMethod || 'random',
          participantLimit: questData.participantLimit || aiDto.expectedWinners || 10,
          rewardPool: {
            amount: questData.rewardPool?.amount || 100,
            currency: questData.rewardPool?.currency || 'POINTS',
            rewardType: questData.rewardPool?.rewardType || 'points',
            customReward: questData.rewardPool?.customReward
          },
          tasks: questData.tasks || [],
          isAIGenerated: true,
          aiPrompt: aiDto.prompt
        };

        logger.info(`AI quest generated successfully`, { adminId: communityAdminId, prompt: aiDto.prompt });
        return aiQuest;
      } catch (parseError) {
        logger.error("Failed to parse AI response:", parseError);
        throw new CustomError("AI generated invalid response format", StatusCode.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      logger.error("Generate AI quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to generate quest with AI", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestParticipants(questId: string, communityAdminId: string, query: GetParticipantsQueryDto): Promise<{ participants: any[]; total: number; pages: number }> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access
      
      const { page = 1, limit = 10, status } = query;
      const { participants, total } = await this._questRepository.findParticipantsByQuest(questId, page, limit, status);
      
      const pages = Math.ceil(total / limit);
      return { participants, total, pages };
    } catch (error) {
      logger.error("Get quest participants error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get participants", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getParticipantDetails(questId: string, participantId: string, communityAdminId: string): Promise<any> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access
      
      const participant = await this._questRepository.findParticipant(questId, participantId);
      if (!participant) {
        throw new CustomError("Participant not found", StatusCode.NOT_FOUND);
      }

      // Get participant's submissions
      const { submissions } = await this._questRepository.findSubmissionsByQuest(questId, 1, 100);
      const participantSubmissions = submissions.filter(s => s.userId.toString() === participantId);

      return {
        ...participant,
        submissions: participantSubmissions
      };
    } catch (error) {
      logger.error("Get participant details error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get participant details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async selectWinners(communityAdminId: string, selectDto: SelectWinnersDto): Promise<{ winners: any[]; message: string }> {
    try {
      const quest = await this.getQuestById(selectDto.questId, communityAdminId);
      
      if (quest.status !== 'ended') {
        throw new CustomError("Quest must be ended to select winners", StatusCode.BAD_REQUEST);
      }

      if (quest.winnersSelected) {
        throw new CustomError("Winners have already been selected", StatusCode.BAD_REQUEST);
      }

      // Get completed participants
      const { participants } = await this._questRepository.findParticipantsByQuest(
        selectDto.questId, 
        1, 
        1000, // Get all completed participants
        'completed'
      );

      if (participants.length === 0) {
        throw new CustomError("No completed participants found", StatusCode.BAD_REQUEST);
      }

      let winners: any[] = [];
      const method = selectDto.method || quest.selectionMethod;
      const winnerCount = Math.min(quest.participantLimit, participants.length);

      if (method === 'fcfs') {
        // First come, first served based on completion time
        winners = participants
          .sort((a, b) => new Date(a.completedAt as Date).getTime() - new Date(b.completedAt as Date).getTime())
          .slice(0, winnerCount);
      } else {
        // Random selection
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        winners = shuffled.slice(0, winnerCount);
      }

      // Update winners in database
      const winnerIds = winners.map(w => w._id.toString());
      await this._questRepository.selectWinners(selectDto.questId, winnerIds);

      // Update quest as winners selected
      await this._questRepository.updateQuest(selectDto.questId, { winnersSelected: true });

      logger.info(`Winners selected for quest`, { questId: selectDto.questId, winnerCount: winners.length });
      return {
        winners,
        message: `${winners.length} winners selected successfully`
      };
    } catch (error) {
      logger.error("Select winners error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to select winners", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async disqualifyParticipant(questId: string, participantId: string, reason: string, communityAdminId: string): Promise<boolean> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access
      
      const updated = await this._questRepository.updateParticipant(participantId, {
        status: 'disqualified',
        disqualificationReason: reason,
        isWinner: false
      });

      return !!updated;
    } catch (error) {
      logger.error("Disqualify participant error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to disqualify participant", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestStats(questId: string, communityAdminId: string): Promise<any> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access
      
      const stats = await this._questRepository.getQuestStats(questId);
      return stats;
    } catch (error) {
      logger.error("Get quest stats error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest stats", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCommunityQuestStats(communityAdminId: string): Promise<QuestStatsResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const stats = await this._questRepository.getCommunityQuestStats(admin.communityId.toString());
      return new QuestStatsResponseDto(stats);
    } catch (error) {
      logger.error("Get community quest stats error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest stats", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async startQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);
      
      if (quest.status !== 'draft') {
        throw new CustomError("Only draft quests can be started", StatusCode.BAD_REQUEST);
      }

      const updatedQuest = await this._questRepository.updateQuest(questId, { status: 'active' });
      if (!updatedQuest) {
        throw new CustomError("Failed to start quest", StatusCode.INTERNAL_SERVER_ERROR);
      }

      return new QuestResponseDto(updatedQuest);
    } catch (error) {
      logger.error("Start quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to start quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async endQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);
      
      if (quest.status !== 'active') {
        throw new CustomError("Only active quests can be ended", StatusCode.BAD_REQUEST);
      }

      const updatedQuest = await this._questRepository.updateQuest(questId, { status: 'ended' });
      if (!updatedQuest) {
        throw new CustomError("Failed to end quest", StatusCode.INTERNAL_SERVER_ERROR);
      }

      return new QuestResponseDto(updatedQuest);
    } catch (error) {
      logger.error("End quest error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to end quest", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadQuestBanner(questId: string, file: Express.Multer.File, communityAdminId: string): Promise<{ bannerUrl: string }> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access

      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'quest-banners',
          public_id: `quest_${questId}_${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        }
      );

      const bannerUrl = uploadResult.secure_url;
      await this._questRepository.updateQuest(questId, { bannerImage: bannerUrl });

      return { bannerUrl };
    } catch (error) {
      logger.error("Upload quest banner error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to upload banner", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}