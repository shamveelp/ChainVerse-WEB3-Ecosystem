import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminQuestService } from "../../core/interfaces/services/quest/ICommunityAdminQuest.service";
import { ICommunityAdminQuestRepository } from "../../core/interfaces/repositories/quest/ICommunityAdminQuest.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import {
  CreateQuestDto,
  UpdateQuestDto,
  GetQuestsQueryDto,
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto,
  QuestResponseDto,
  QuestStatsResponseDto,
  QuestTaskDto,
  QuestParticipantResponseDto,
  QuestParticipantDetailsDto,
  QuestWinnerResponseDto,
  ChatWithAIResponseDto,
  QuestSubmissionDto
} from "../../dtos/quest/CommunityAdminQuest.dto";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { geminiModel } from "../../config/geminiClient";
import cloudinary from "../../config/cloudinary";
import logger from "../../utils/logger";
import mongoose from "mongoose";
import { IQuestTask } from "../../models/questTask.model";
import { UserModel } from "../../models/user.models";
import { PointsHistoryModel } from "../../models/pointsHistory.model";
import { IQuestParticipant } from "../../models/questParticipant.model";

@injectable()
export class CommunityAdminQuestService implements ICommunityAdminQuestService {
  constructor(
    @inject(TYPES.ICommunityAdminQuestRepository) private _questRepository: ICommunityAdminQuestRepository,
    @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
    @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
  ) { }

  async createQuest(communityAdminId: string, createDto: CreateQuestDto): Promise<QuestResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      // Enhanced validation
      this.validateQuestData(createDto);

      // Create quest with tasks
      const questData = {
        ...createDto,
        communityId: new mongoose.Types.ObjectId(admin.communityId.toString()),
        communityAdminId: new mongoose.Types.ObjectId(communityAdminId),
        status: 'draft' as const,
        totalParticipants: 0,
        totalSubmissions: 0,
        winnersSelected: false,
        rewardsDistributed: false
      };

      const quest = await this._questRepository.createQuest(questData);

      // Create quest tasks with enhanced validation
      if (createDto.tasks && createDto.tasks.length > 0) {
        for (const taskDto of createDto.tasks) {
          this.validateTaskData(taskDto);

          const taskData = {
            ...taskDto,
            questId: quest._id,
            completedBy: 0,
            privilegePoints: taskDto.privilegePoints || 1, // Default to 1 if not specified
            config: taskDto.config ? {
              ...taskDto.config,
              targetUserId: taskDto.config.targetUserId ? new mongoose.Types.ObjectId(taskDto.config.targetUserId) : undefined,
              communityId: taskDto.config.communityId ? new mongoose.Types.ObjectId(taskDto.config.communityId) : undefined
            } : undefined
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

  private validateQuestData(createDto: CreateQuestDto): void {
    // Title validation
    if (!createDto.title || createDto.title.trim().length === 0) {
      throw new CustomError("Quest title is required", StatusCode.BAD_REQUEST);
    }
    if (createDto.title.length > 200) {
      throw new CustomError("Quest title must be less than 200 characters", StatusCode.BAD_REQUEST);
    }

    // Description validation
    if (!createDto.description || createDto.description.trim().length === 0) {
      throw new CustomError("Quest description is required", StatusCode.BAD_REQUEST);
    }
    if (createDto.description.length > 2000) {
      throw new CustomError("Quest description must be less than 2000 characters", StatusCode.BAD_REQUEST);
    }

    // Date validation
    const now = new Date();
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (startDate <= now) {
      throw new CustomError("Start date must be in the future", StatusCode.BAD_REQUEST);
    }

    if (endDate <= startDate) {
      throw new CustomError("End date must be after start date", StatusCode.BAD_REQUEST);
    }

    // Participant limit validation
    if (!createDto.participantLimit || createDto.participantLimit < 1) {
      throw new CustomError("Winner limit must be at least 1", StatusCode.BAD_REQUEST);
    }
    if (createDto.participantLimit > 1000) {
      throw new CustomError("Winner limit cannot exceed 1000", StatusCode.BAD_REQUEST);
    }

    // Reward validation
    if (!createDto.rewardPool || createDto.rewardPool.amount <= 0) {
      throw new CustomError("Reward amount must be greater than 0", StatusCode.BAD_REQUEST);
    }
    if (!createDto.rewardPool.currency || createDto.rewardPool.currency.trim().length === 0) {
      throw new CustomError("Reward currency is required", StatusCode.BAD_REQUEST);
    }

    // Only allow points rewards for now
    if (createDto.rewardPool.rewardType !== 'points') {
      throw new CustomError("Only points rewards are supported currently", StatusCode.BAD_REQUEST);
    }

    // Tasks validation
    if (!createDto.tasks || createDto.tasks.length === 0) {
      throw new CustomError("At least one task is required", StatusCode.BAD_REQUEST);
    }

    // Selection method validation
    const validMethods = ['fcfs', 'random', 'leaderboard'];
    if (!validMethods.includes(createDto.selectionMethod)) {
      throw new CustomError("Invalid selection method", StatusCode.BAD_REQUEST);
    }

    // If leaderboard method, validate privilege points
    if (createDto.selectionMethod === 'leaderboard') {
      for (const task of createDto.tasks) {
        if (!task.privilegePoints || task.privilegePoints < 1 || task.privilegePoints > 10) {
          throw new CustomError("Privilege points must be between 1-10 for leaderboard selection", StatusCode.BAD_REQUEST);
        }
      }
    }
  }

  private validateTaskData(taskDto: QuestTaskDto): void {
    if (!taskDto.title || taskDto.title.trim().length === 0) {
      throw new CustomError("Task title is required", StatusCode.BAD_REQUEST);
    }
    if (!taskDto.description || taskDto.description.trim().length === 0) {
      throw new CustomError("Task description is required", StatusCode.BAD_REQUEST);
    }

    // Privilege points validation
    if (taskDto.privilegePoints !== undefined) {
      if (taskDto.privilegePoints < 1 || taskDto.privilegePoints > 10) {
        throw new CustomError("Privilege points must be between 1-10", StatusCode.BAD_REQUEST);
      }
    }

    // Task-specific validation
    switch (taskDto.taskType) {
      case 'join_community':
        if (!taskDto.config?.communityId) {
          throw new CustomError("Community selection is required for join community task", StatusCode.BAD_REQUEST);
        }
        break;
      case 'follow_user':
        if (!taskDto.config?.targetUserId) {
          throw new CustomError("User selection is required for follow user task", StatusCode.BAD_REQUEST);
        }
        break;
      case 'nft_mint':
        if (!taskDto.config?.contractAddress) {
          throw new CustomError("Contract address is required for NFT mint task", StatusCode.BAD_REQUEST);
        }
        break;
      case 'token_hold':
        if (!taskDto.config?.tokenAddress) {
          throw new CustomError("Token address is required for token hold task", StatusCode.BAD_REQUEST);
        }
        if (!taskDto.config?.minimumAmount || taskDto.config.minimumAmount <= 0) {
          throw new CustomError("Minimum amount is required for token hold task", StatusCode.BAD_REQUEST);
        }
        break;
      case 'custom':
        if (!taskDto.config?.customInstructions || taskDto.config.customInstructions.trim().length === 0) {
          throw new CustomError("Custom instructions are required for custom task", StatusCode.BAD_REQUEST);
        }
        break;
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
      let questCommunityId: string;
      if (quest.communityId && typeof quest.communityId === 'object' && '_id' in quest.communityId) {
        questCommunityId = quest.communityId.toString();
      } else {
        questCommunityId = (quest.communityId as mongoose.Types.ObjectId).toString();
      }

      const adminCommunityId = admin.communityId?.toString();

      if (!adminCommunityId || questCommunityId !== adminCommunityId) {
        throw new CustomError("Access denied", StatusCode.FORBIDDEN);
      }

      // Get quest tasks
      const tasks = await this._questRepository.findTasksByQuest(questId);

      const questResponse = new QuestResponseDto(quest);
      questResponse.tasks = tasks.map(task => {
        const taskObj = task.toObject ? task.toObject() : task;
        return {
          ...taskObj,
          _id: task._id.toString(),
          questId: task.questId.toString(),
          config: task.config ? {
            ...task.config,
            communityId: task.config.communityId?.toString(),
            targetUserId: task.config.targetUserId?.toString()
          } : undefined
        } as unknown as QuestTaskDto;
      });

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

      // Validate update data
      if (updateDto.title !== undefined) {
        if (!updateDto.title.trim()) {
          throw new CustomError("Quest title cannot be empty", StatusCode.BAD_REQUEST);
        }
        if (updateDto.title.length > 200) {
          throw new CustomError("Quest title must be less than 200 characters", StatusCode.BAD_REQUEST);
        }
      }

      if (updateDto.description !== undefined) {
        if (!updateDto.description.trim()) {
          throw new CustomError("Quest description cannot be empty", StatusCode.BAD_REQUEST);
        }
        if (updateDto.description.length > 2000) {
          throw new CustomError("Quest description must be less than 2000 characters", StatusCode.BAD_REQUEST);
        }
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

      // Only allow points rewards
      if (updateDto.rewardPool && updateDto.rewardPool.rewardType && updateDto.rewardPool.rewardType !== 'points') {
        throw new CustomError("Only points rewards are supported currently", StatusCode.BAD_REQUEST);
      }

      const updatedQuest = await this._questRepository.updateQuest(questId, updateDto);
      if (!updatedQuest) {
        throw new CustomError("Failed to update quest", StatusCode.INTERNAL_SERVER_ERROR);
      }

      // Update tasks if provided
      if (updateDto.tasks) {
        // Validate tasks
        for (const taskDto of updateDto.tasks) {
          this.validateTaskData(taskDto);
        }

        // Delete existing tasks
        await this._questRepository.deleteTasksByQuest(questId);

        // Create new tasks
        for (const taskDto of updateDto.tasks) {
          const taskData = {
            ...taskDto,
            questId: new mongoose.Types.ObjectId(questId),
            completedBy: 0,
            config: taskDto.config ? {
              ...taskDto.config,
              targetUserId: taskDto.config.targetUserId ? new mongoose.Types.ObjectId(taskDto.config.targetUserId) : undefined,
              communityId: taskDto.config.communityId ? new mongoose.Types.ObjectId(taskDto.config.communityId) : undefined
            } : undefined
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
        4. Selection method (fcfs, random, or leaderboard)
        5. Participant limit (winners)
        6. Reward pool with appropriate currency and type (only use 'points' for rewardType)
        7. 3-5 relevant tasks with proper task types and configurations
        8. If using leaderboard selection, assign privilege points (1-10) to each task

        Available task types: join_community, follow_user, twitter_post, upload_screenshot, wallet_connect, custom

        For task configurations:
        - join_community: requires communityId, communityName, communityUsername
        - follow_user: requires targetUserId, targetUsername
        - twitter_post: can have twitterText, twitterHashtags array
        - upload_screenshot: can have customInstructions, websiteUrl
        - wallet_connect: can have customInstructions
        - custom: requires customInstructions

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
            "currency": "POINTS",
            "rewardType": "points"
          },
          "tasks": [
            {
              "title": "Task Title",
              "description": "Task description",
              "taskType": "join_community",
              "isRequired": true,
              "order": 1,
              "privilegePoints": 2,
              "config": {
                "requiresProof": true,
                "proofType": "image"
              }
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
            currency: 'POINTS',
            rewardType: 'points',
            customReward: questData.rewardPool?.customReward
          },
          tasks: questData.tasks ? (questData.tasks as unknown as Array<Record<string, unknown>>).map((task, index: number) => ({
            ...task,
            order: index + 1,
            privilegePoints: (task.privilegePoints as number) || 1
          } as unknown as QuestTaskDto)) : [],
          isAIGenerated: true,
          aiPrompt: aiDto.prompt
        };

        // Validate the generated quest
        this.validateQuestData(aiQuest);

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

  async chatWithAI(communityAdminId: string, message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<ChatWithAIResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const community = await this._communityRepository.findById(admin.communityId.toString());
      if (!community) {
        throw new CustomError("Community not found", StatusCode.NOT_FOUND);
      }

      // Construct the system prompt
      const systemPrompt = `
        You are an AI assistant helping a community manager create a quest for their Web3 community.
        Community details:
        Name: ${community.communityName}
        Description: ${community.description}

        Your goal is to gather information to create a quest. You need to know:
        1. Quest Title
        2. Description
        3. Start/End Dates (or duration)
        4. Tasks (what users need to do)
        5. Rewards (points amount)

        CRITICAL - TASK CONFIGURATION RULES:
        1. "Join Community" task (\`taskType: "join_community"\`): REQUIRED \`communityId\`. If you don't have it, ASK: "Please select a community".
        2. "Follow User" task (\`taskType: "follow_user"\`): REQUIRED \`targetUserId\`. If you don't have it, ASK: "Please select a user".
        3. "Token Hold" task (\`taskType: "token_hold"\`): REQUIRED \`tokenAddress\` and \`minimumAmount\`.
        
        DO NOT generate fake IDs. If you need an ID, you MUST ask the user to select it first using "Please select a community" or "Please select a user".
        Only when the user replies with the selection (which will include the ID), allow the generation.

        Interact naturally with the user. If the user provides enough information to create a quest, OR if they explicitly ask to generate/create it, you MUST generate a valid JSON object matching the CreateQuestDto structure.

        If you are just chatting, return a plain text response.
        If you are generating the quest, your response must START with specific marker "||GENERATE_QUEST||" followed by the JSON object.

        JSON Structure for Quest:
        {
          "title": "string",
          "description": "string",
          "startDate": "ISO date string",
          "endDate": "ISO date string",
          "selectionMethod": "random" | "fcfs" | "leaderboard",
          "participantLimit": number,
          "rewardPool": { "amount": number, "currency": "POINTS", "rewardType": "points" },
          "tasks": [ { "title": "string", "description": "string", "taskType": "string", "isRequired": boolean, "config": {} } ]
        }
      `;

      // Construct chat history
      let chatHistory = "System: " + systemPrompt + "\n\n";
      if (history && history.length > 0) {
        history.forEach(msg => {
          chatHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
      }
      chatHistory += `User: ${message}\nAssistant:`;

      const result = await geminiModel.generateContent(chatHistory);
      const response = await result.response;
      const text = response.text();

      // Check if response contains generation marker
      if (text.includes("||GENERATE_QUEST||")) {
        try {
          const jsonStr = text.split("||GENERATE_QUEST||")[1].trim();
          // Extract JSON if there's trailing text
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const questData = JSON.parse(jsonMatch[0]);
            // Set defaults if missing
            const now = new Date();
            const startDate = questData.startDate ? new Date(questData.startDate) : new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
            const endDate = questData.endDate ? new Date(questData.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const processedQuest: CreateQuestDto = {
              title: questData.title || "New Quest",
              description: questData.description || "Quest description",
              startDate,
              endDate,
              selectionMethod: questData.selectionMethod || 'random',
              participantLimit: questData.participantLimit || 10,
              rewardPool: {
                amount: questData.rewardPool?.amount || 100,
                currency: 'POINTS',
                rewardType: 'points',
                customReward: questData.rewardPool?.customReward
              },
              tasks: questData.tasks ? (questData.tasks as unknown as Array<Record<string, unknown>>).map((task, index: number) => ({
                ...task,
                order: index + 1,
                privilegePoints: (task.privilegePoints as number) || 1
              } as unknown as QuestTaskDto)) : [],
              isAIGenerated: true,
              aiPrompt: message
            };

            return {
              response: "I've generated a quest based on our conversation! You can review it below.",
              questGenerated: true,
              questData: processedQuest
            };
          }
        } catch (e) {
          logger.error("Failed to parse generated quest JSON", e);
          // Fallback to text response if JSON fails
        }
      }

      // Identify if we need specific inputs
      const needsInput = [];
      const lowerText = text.toLowerCase();
      if (lowerText.includes("please select a community") || lowerText.includes("select a community")) {
        needsInput.push({ type: 'community', field: 'communityId', prompt: "Please select a community for the task:" });
      }
      else if (lowerText.includes("please select a user") || lowerText.includes("select a user")) {
        needsInput.push({ type: 'user', field: 'userId', prompt: "Please select a user for the task:" });
      }

      return {
        response: text.replace("||GENERATE_QUEST||", "").trim().split("{")[0], // Remove JSON part if it leaked but wasn't caught properly or just text
        questGenerated: false,
        needsInput
      };

    } catch (error) {
      logger.error("AI Chat error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to chat with AI", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestParticipants(questId: string, communityAdminId: string, query: GetParticipantsQueryDto): Promise<{ participants: QuestParticipantResponseDto[]; total: number; pages: number }> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access

      const { page = 1, limit = 10, status } = query;
      const { participants, total } = await this._questRepository.findParticipantsByQuest(questId, page, limit, status);

      const pages = Math.ceil(total / limit);
      return {
        participants: participants.map(p => {
          const user = p.userId as unknown as { _id: mongoose.Types.ObjectId; username: string; name: string; profilePic?: string };
          return {
            _id: p._id.toString(),
            userId: user._id?.toString() || p.userId.toString(),
            username: user.username || 'user',
            name: user.name || 'User',
            profilePic: user.profilePic,
            status: p.status,
            joinedAt: p.joinedAt,
            totalTasksCompleted: p.totalTasksCompleted,
            totalPrivilegePoints: p.totalPrivilegePoints,
            isWinner: p.isWinner,
            rewardClaimed: p.rewardClaimed
          };
        }),
        total,
        pages
      };
    } catch (error) {
      logger.error("Get quest participants error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get participants", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getParticipantDetails(questId: string, participantId: string, communityAdminId: string): Promise<QuestParticipantDetailsDto> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access

      const participant = await this._questRepository.findParticipant(questId, participantId);
      if (!participant) {
        throw new CustomError("Participant not found", StatusCode.NOT_FOUND);
      }

      // Get participant's submissions directly using the specific repository method
      const participantSubmissions = await this._questRepository.findSubmissionsByUserAndQuest(participant.userId._id.toString(), questId);

      const user = participant.userId as unknown as { _id: mongoose.Types.ObjectId; username: string; name: string; profilePic?: string };

      return {
        _id: participant._id.toString(),
        userId: user._id.toString(),
        username: user.username || 'user',
        name: user.name || 'User',
        profilePic: user.profilePic,
        status: participant.status,
        joinedAt: participant.joinedAt,
        totalTasksCompleted: participant.totalTasksCompleted,
        totalPrivilegePoints: participant.totalPrivilegePoints,
        isWinner: participant.isWinner,
        rewardClaimed: participant.rewardClaimed,
        walletAddress: participant.walletAddress,
        submissions: participantSubmissions.map(s => ({
          _id: s._id.toString(),
          questId: s.questId.toString(),
          taskId: s.taskId.toString(),
          userId: s.userId.toString(),
          submissionData: s.submissionData,
          status: s.status,
          reviewedBy: s.reviewedBy?.toString(),
          reviewComment: s.reviewComment,
          submittedAt: s.submittedAt,
          reviewedAt: s.reviewedAt
        }))
      };
    } catch (error) {
      logger.error("Get participant details error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get participant details", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async selectWinners(communityAdminId: string, selectDto: SelectWinnersDto): Promise<{ winners: QuestWinnerResponseDto[]; message: string }> {
    try {
      const quest = await this.getQuestById(selectDto.questId, communityAdminId);

      if (quest.status !== 'ended') {
        throw new CustomError("Quest must be ended to select winners", StatusCode.BAD_REQUEST);
      }

      if (quest.winnersSelected) {
        throw new CustomError("Winners have already been selected for this quest", StatusCode.BAD_REQUEST);
      }

      let winners: IQuestParticipant[] = [];
      const method = selectDto.method || quest.selectionMethod;
      const winnerCount = quest.participantLimit;

      switch (method) {
        case 'fcfs':
          winners = await this._questRepository.getParticipantsByFCFS(selectDto.questId, winnerCount);
          break;
        case 'leaderboard':
          winners = await this._questRepository.getParticipantsByLeaderboard(selectDto.questId, winnerCount);
          break;
        case 'random':
        default:
          winners = await this._questRepository.getRandomParticipants(selectDto.questId, winnerCount);
          break;
      }

      if (winners.length === 0) {
        throw new CustomError("No qualified participants found", StatusCode.BAD_REQUEST);
      }

      // Update winners in database
      const winnerIds = winners.map(w => w._id.toString());
      await this._questRepository.selectWinners(selectDto.questId, winnerIds);

      // Reward Distribution Logic
      let rewardMessage = "";
      if (quest.rewardPool.rewardType === 'points' && !quest.rewardsDistributed) {
        const pointsPerWinner = Math.floor(quest.rewardPool.amount / quest.participantLimit);

        if (pointsPerWinner > 0) {
          const distributionPromises = winners.map(async (winner) => {
            // Safety check in case user was deleted or population failed
            if (!winner.userId || !winner.userId._id) {
              logger.warn(`Could not distribute rewards to participant ${winner._id}: User not found`);
              return;
            }

            // Update User Points
            await UserModel.findByIdAndUpdate(winner.userId._id, {
              $inc: { totalPoints: pointsPerWinner }
            });

            // Create Points History
            await PointsHistoryModel.create({
              userId: winner.userId._id,
              type: 'quest_reward',
              points: pointsPerWinner,
              description: `Reward for winning quest: ${quest.title}`,
              relatedId: quest._id.toString()
            });
          });

          await Promise.all(distributionPromises);

          await this._questRepository.updateQuest(selectDto.questId, {
            winnersSelected: true,
            rewardsDistributed: true
          });

          rewardMessage = `. ${winners.length} winners received ${pointsPerWinner} points each.`;
        } else {
          // Just update winners selected if points are 0 (e.g. integer division result)
          await this._questRepository.updateQuest(selectDto.questId, { winnersSelected: true });
        }
      } else {
        // Just update winners selected for other reward types or if already distributed
        await this._questRepository.updateQuest(selectDto.questId, { winnersSelected: true });
      }

      logger.info(`Winners selected for quest using ${method} method`, {
        questId: selectDto.questId,
        winnerCount: winners.length,
        method
      });

      return {
        winners: winners.map(w => {
          const user = w.userId as unknown as { _id: mongoose.Types.ObjectId; username: string; name: string; profilePic?: string };
          return {
            _id: w._id.toString(),
            userId: user._id?.toString() || w.userId.toString(),
            username: user.username || 'user',
            name: user.name || 'User',
            profilePic: user.profilePic,
            rewardAmount: Math.floor(quest.rewardPool.amount / (quest.participantLimit || 1)),
            rewardCurrency: quest.rewardPool.currency
          };
        }),
        message: `${winners.length} winners selected successfully using ${method} method${rewardMessage}`
      };
    } catch (error) {
      logger.error("Select winners error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to select winners", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async selectReplacementWinners(questId: string, communityAdminId: string, count: number): Promise<{ winners: QuestWinnerResponseDto[]; message: string }> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);

      if (quest.status !== 'ended') {
        throw new CustomError("Quest must be ended to select replacement winners", StatusCode.BAD_REQUEST);
      }

      if (!quest.winnersSelected) {
        throw new CustomError("Must select initial winners first", StatusCode.BAD_REQUEST);
      }

      // Get qualified participants who are not already winners or disqualified
      const qualifiedParticipants = await this._questRepository.getQualifiedParticipants(questId);
      const availableParticipants = qualifiedParticipants.filter(p =>
        !p.isWinner && p.status !== 'disqualified'
      );

      if (availableParticipants.length === 0) {
        throw new CustomError("No replacement participants available", StatusCode.BAD_REQUEST);
      }

      const replacementCount = Math.min(count, availableParticipants.length);
      let replacementWinners: IQuestParticipant[] = [];

      // Use the same selection method as the original quest
      switch (quest.selectionMethod) {
        case 'fcfs':
          replacementWinners = availableParticipants
            .sort((a, b) => new Date(a.completedAt as Date).getTime() - new Date(b.completedAt as Date).getTime())
            .slice(0, replacementCount);
          break;
        case 'leaderboard':
          replacementWinners = availableParticipants
            .sort((a, b) => b.totalPrivilegePoints - a.totalPrivilegePoints)
            .slice(0, replacementCount);
          break;
        case 'random':
        default:
          const shuffled = [...availableParticipants].sort(() => 0.5 - Math.random());
          replacementWinners = shuffled.slice(0, replacementCount);
          break;
      }

      // Update replacement winners in database
      const winnerIds = replacementWinners.map(w => w._id.toString());
      await this._questRepository.selectWinners(questId, winnerIds);

      logger.info(`Replacement winners selected for quest`, {
        questId,
        replacementCount,
        method: quest.selectionMethod
      });

      return {
        winners: replacementWinners.map(w => {
          const user = w.userId as unknown as { _id: mongoose.Types.ObjectId; username: string; name: string; profilePic?: string };
          return {
            _id: w._id.toString(),
            userId: user._id?.toString() || w.userId.toString(),
            username: user.username || 'user',
            name: user.name || 'User',
            profilePic: user.profilePic,
            rewardAmount: Math.floor(quest.rewardPool.amount / (quest.participantLimit || 1)),
            rewardCurrency: quest.rewardPool.currency
          };
        }),
        message: `${replacementWinners.length} replacement winners selected successfully`
      };
    } catch (error) {
      logger.error("Select replacement winners error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to select replacement winners", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async disqualifyParticipant(questId: string, participantId: string, reason: string, communityAdminId: string): Promise<boolean> {
    try {
      await this.getQuestById(questId, communityAdminId); // Verify access

      const updated = await this._questRepository.updateParticipant(participantId, {
        status: 'disqualified',
        disqualificationReason: reason,
        disqualifiedAt: new Date(),
        isWinner: false
      });

      if (updated) {
        logger.info(`Participant disqualified`, { questId, participantId, reason });
      }

      return !!updated;
    } catch (error) {
      logger.error("Disqualify participant error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to disqualify participant", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async distributeRewards(questId: string, communityAdminId: string): Promise<{ success: boolean; message: string; winnersRewarded: number }> {
    try {
      const quest = await this.getQuestById(questId, communityAdminId);

      if (quest.status !== 'ended') {
        throw new CustomError("Quest must be ended to distribute rewards", StatusCode.BAD_REQUEST);
      }

      if (!quest.winnersSelected) {
        throw new CustomError("Winners must be selected before distributing rewards", StatusCode.BAD_REQUEST);
      }

      if (quest.rewardsDistributed) {
        throw new CustomError("Rewards have already been distributed for this quest", StatusCode.BAD_REQUEST);
      }

      // Only support points rewards for now
      if (quest.rewardPool.rewardType !== 'points') {
        throw new CustomError("Only points rewards are supported currently", StatusCode.BAD_REQUEST);
      }

      const success = await this._questRepository.distributeRewards(questId);

      if (success) {
        // Get winner count for response
        const stats = await this._questRepository.getQuestStats(questId);

        logger.info(`Rewards distributed successfully`, {
          questId,
          winnersRewarded: stats.winnersSelected,
          totalAmount: quest.rewardPool.amount
        });

        return {
          success: true,
          message: `Rewards distributed successfully to ${stats.winnersSelected} winners`,
          winnersRewarded: stats.winnersSelected
        };
      } else {
        throw new CustomError("No eligible winners found for reward distribution", StatusCode.BAD_REQUEST);
      }
    } catch (error) {
      logger.error("Distribute rewards error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to distribute rewards", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestStats(questId: string, communityAdminId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    completedParticipants: number;
    pendingReviews: number;
    winnersSelected: number;
    rewardsDistributed: boolean;
  }> {
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

      // If start date is in the future, set it to now so users can join immediately
      const updateData: Record<string, unknown> = { status: 'active' };
      if (new Date(quest.startDate) > new Date()) {
        updateData.startDate = new Date();
      }

      const updatedQuest = await this._questRepository.updateQuest(questId, updateData);
      if (!updatedQuest) {
        throw new CustomError("Failed to start quest", StatusCode.INTERNAL_SERVER_ERROR);
      }

      logger.info(`Quest started successfully`, { questId, adminId: communityAdminId });
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

      logger.info(`Quest ended successfully`, { questId, adminId: communityAdminId });
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

      logger.info(`Quest banner uploaded successfully`, { questId, bannerUrl });
      return { bannerUrl };
    } catch (error) {
      logger.error("Upload quest banner error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to upload banner", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getQuestLeaderboard(questId: string, communityAdminId: string): Promise<QuestParticipantResponseDto[]> {
    try {
      const participants = await this._questRepository.getQuestLeaderboard(questId);
      return participants.map(p => {
        const user = p.userId as unknown as { _id: mongoose.Types.ObjectId; username: string; name: string; profilePic?: string };
        return {
          _id: p._id.toString(),
          userId: user._id?.toString() || p.userId.toString(),
          username: user.username || 'user',
          name: user.name || 'User',
          profilePic: user.profilePic,
          status: p.status,
          joinedAt: p.joinedAt,
          totalTasksCompleted: p.totalTasksCompleted,
          totalPrivilegePoints: p.totalPrivilegePoints,
          isWinner: p.isWinner,
          rewardClaimed: p.rewardClaimed
        };
      });
    } catch (error) {
      logger.error("Get quest leaderboard error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to get quest leaderboard", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}