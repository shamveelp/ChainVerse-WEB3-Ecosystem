import { injectable } from "inversify";
import { IUserQuestRepository } from "../../core/interfaces/repositories/quest/IUserQuest.repository";
import QuestModel, { IQuest } from "../../models/quest.model";
import QuestTaskModel, { IQuestTask } from "../../models/questTask.model";
import QuestParticipantModel, { IQuestParticipant } from "../../models/questParticipant.model";
import QuestSubmissionModel, { IQuestSubmission } from "../../models/questSubmission.model";
import mongoose from "mongoose";

@injectable()
export class UserQuestRepository implements IUserQuestRepository {
  // Quest operations
  async findAvailableQuests(page: number, limit: number, filters: any = {}): Promise<{ quests: IQuest[]; total: number }> {
    const skip = (page - 1) * limit;
    const { sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;   

    const [quests, total] = await Promise.all([
      QuestModel.find(queryFilters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('communityId', 'communityName logo username')
        .lean(),
      QuestModel.countDocuments(queryFilters)
    ]);

    return { quests, total };
  }

  async findQuestById(questId: string): Promise<IQuest | null> {
    return await QuestModel.findById(questId)
      .populate('communityId', 'communityName logo username')
      .lean();
  }

  async findTopQuests(limit: number): Promise<IQuest[]> { 
    return await QuestModel.find({
      status: { $in: ['active', 'ended'] }
    })
      .sort({ totalParticipants: -1, createdAt: -1 })     
      .limit(limit)
      .populate('communityId', 'communityName logo username')
      .lean();
  }

  // Participation operations
  async findParticipantByUserAndQuest(userId: string, questId: string): Promise<IQuestParticipant | null> {
    return await QuestParticipantModel.findOne({ userId, questId }).lean();
  }

  async createParticipant(participantData: Partial<IQuestParticipant>): Promise<IQuestParticipant> {
    const participant = new QuestParticipantModel(participantData);
    return await participant.save();
  }

  async updateParticipant(participantId: string, updateData: Partial<IQuestParticipant>): Promise<IQuestParticipant | null> {
    return await QuestParticipantModel.findByIdAndUpdate( 
      participantId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async findMyQuests(userId: string, page: number, limit: number, status?: string): Promise<{ quests: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { userId };

    if (status) {
      filter.status = status;
    }

    const [participations, total] = await Promise.all([   
      QuestParticipantModel.find(filter)
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'questId',
          populate: {
            path: 'communityId',
            select: 'communityName logo username'
          }
        })
        .lean(),
      QuestParticipantModel.countDocuments(filter)        
    ]);

    const questsWithDetails = participations.map(participation => ({
      ...participation,
      quest: participation.questId
    }));

    return { quests: questsWithDetails, total };
  }

  // Task operations
  async findTasksByQuest(questId: string): Promise<IQuestTask[]> {
    return await QuestTaskModel.find({ questId })
      .sort({ order: 1 })
      .lean();
  }

  async findSubmissionByUserTaskQuest(userId: string, taskId: string, questId: string): Promise<IQuestSubmission | null> {
    return await QuestSubmissionModel.findOne({ userId, taskId, questId }).lean();
  }

  async createSubmission(submissionData: Partial<IQuestSubmission>): Promise<IQuestSubmission> {
    const submission = new QuestSubmissionModel(submissionData);
    return await submission.save();
  }

  async updateSubmission(submissionId: string, updateData: Partial<IQuestSubmission>): Promise<IQuestSubmission | null> {
    return await QuestSubmissionModel.findByIdAndUpdate(  
      submissionId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async findSubmissionsByUserAndQuest(userId: string, questId: string): Promise<IQuestSubmission[]> {
    return await QuestSubmissionModel.find({ userId, questId })
      .populate('taskId', 'title taskType')
      .sort({ submittedAt: -1 })
      .lean();
  }

  // Enhanced analytics
  async getQuestParticipantStats(questId: string): Promise<any> {
    const [totalParticipants, completedParticipants, inProgressParticipants, winnerCount] = await Promise.all([     
      QuestParticipantModel.countDocuments({ questId }),  
      QuestParticipantModel.countDocuments({ questId, status: 'completed' }),
      QuestParticipantModel.countDocuments({ questId, status: 'in_progress' }),
      QuestParticipantModel.countDocuments({ questId, isWinner: true })
    ]);

    return {
      totalParticipants,
      completedParticipants,
      inProgressParticipants,
      winnerCount,
      completionRate: totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0
    };
  }

  // Enhanced leaderboard with pagination and proper scoring
  async getQuestLeaderboard(questId: string, page: number = 1, limit: number = 10): Promise<{ participants: any[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    // Get quest details to determine selection method
    const quest = await QuestModel.findById(questId).lean();
    if (!quest) {
      return { participants: [], total: 0, pages: 0 };
    }

    let sortCriteria: any = {};
    
    // Different sorting based on quest selection method
    if (quest.selectionMethod === 'leaderboard') {
      // For leaderboard method: sort by privilege points, then by completion time
      sortCriteria = {
        totalPrivilegePoints: -1,
        completedAt: 1,
        joinedAt: 1
      };
    } else if (quest.selectionMethod === 'fcfs') {
      // For FCFS: sort by completion time
      sortCriteria = {
        completedAt: 1,
        joinedAt: 1
      };
    } else {
      // For random or other methods: sort by tasks completed, then join time
      sortCriteria = {
        totalTasksCompleted: -1,
        joinedAt: 1
      };
    }

    const [participants, total] = await Promise.all([
      QuestParticipantModel.find({ 
        questId,
        status: { $in: ['completed', 'in_progress', 'winner'] }
      })
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username name profilePic')
        .lean(),
      QuestParticipantModel.countDocuments({ 
        questId,
        status: { $in: ['completed', 'in_progress', 'winner'] }
      })
    ]);

    const pages = Math.ceil(total / limit);

    // Add rank to each participant
    const participantsWithRank = participants.map((participant, index) => ({
      ...participant,
      rank: skip + index + 1
    }));

    return { participants: participantsWithRank, total, pages };
  }

  // Check if quest supports leaderboard
  async questSupportsLeaderboard(questId: string): Promise<boolean> {
    const quest = await QuestModel.findById(questId).select('selectionMethod').lean();
    return quest?.selectionMethod === 'leaderboard';
  }

  // Enhanced task completion tracking
  async getTaskCompletionStats(questId: string): Promise<{ taskId: string; completedBy: number; totalParticipants: number; completionRate: number }[]> {
    const tasks = await QuestTaskModel.find({ questId }).lean();
    const totalParticipants = await QuestParticipantModel.countDocuments({ questId });

    return tasks.map(task => ({
      taskId: task._id.toString(),
      completedBy: task.completedBy,
      totalParticipants,
      completionRate: totalParticipants > 0 ? (task.completedBy / totalParticipants) * 100 : 0
    }));
  }

  // Get user's rank in quest
  async getUserRank(userId: string, questId: string): Promise<number> {
    const quest = await QuestModel.findById(questId).lean();
    if (!quest) return 0;

    let sortCriteria: any = {};
    
    if (quest.selectionMethod === 'leaderboard') {
      sortCriteria = {
        totalPrivilegePoints: -1,
        completedAt: 1,
        joinedAt: 1
      };
    } else if (quest.selectionMethod === 'fcfs') {
      sortCriteria = {
        completedAt: 1,
        joinedAt: 1
      };
    } else {
      sortCriteria = {
        totalTasksCompleted: -1,
        joinedAt: 1
      };
    }

    const participants = await QuestParticipantModel.find({ 
      questId,
      status: { $in: ['completed', 'in_progress', 'winner'] }
    })
      .sort(sortCriteria)
      .select('userId')
      .lean();

    const userIndex = participants.findIndex(p => p.userId.toString() === userId);
    return userIndex !== -1 ? userIndex + 1 : 0;
  }

  // Calculate and update participant privilege points
  async updateParticipantPrivilegePoints(participantId: string, questId: string): Promise<void> {
    const participant = await QuestParticipantModel.findById(participantId);
    if (!participant) return;

    // Get completed tasks with their privilege points
    const completedTasks = await QuestTaskModel.find({
      _id: { $in: participant.completedTasks },
      questId
    }).select('privilegePoints').lean();

    const totalPoints = completedTasks.reduce((sum, task) => sum + (task.privilegePoints || 1), 0);

    await QuestParticipantModel.findByIdAndUpdate(participantId, {
      totalPrivilegePoints: totalPoints
    });
  }

  // Updates
  async incrementQuestParticipants(questId: string): Promise<void> {
    await QuestModel.findByIdAndUpdate(questId, {
      $inc: { totalParticipants: 1 }
    });
  }

  async incrementTaskCompletions(taskId: string): Promise<void> {
    await QuestTaskModel.findByIdAndUpdate(taskId, {      
      $inc: { completedBy: 1 }
    });
  }

  // Validate task submission based on task type
  async validateTaskSubmission(taskId: string, submissionData: any): Promise<{ valid: boolean; message?: string }> {
    const task = await QuestTaskModel.findById(taskId).lean();
    if (!task) {
      return { valid: false, message: "Task not found" };
    }

    switch (task.taskType) {
      case 'join_community':
        if (!submissionData.communityId) {
          return { valid: false, message: "Community ID is required" };
        }
        break;
      case 'follow_user':
        if (!submissionData.targetUserId) {
          return { valid: false, message: "Target user ID is required" };
        }
        break;
      case 'twitter_post':
        if (!submissionData.twitterUrl) {
          return { valid: false, message: "Twitter post URL is required" };
        }
        // Validate Twitter URL format
        const twitterUrlPattern = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
        if (!twitterUrlPattern.test(submissionData.twitterUrl)) {
          return { valid: false, message: "Please provide a valid Twitter post URL" };
        }
        break;
      case 'upload_screenshot':
        if (!submissionData.imageUrl) {
          return { valid: false, message: "Screenshot image is required" };
        }
        break;
      case 'wallet_connect':
        if (!submissionData.walletAddress) {
          return { valid: false, message: "Wallet address is required" };
        }
        // Validate Ethereum address format
        const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
        if (!ethAddressPattern.test(submissionData.walletAddress)) {
          return { valid: false, message: "Please provide a valid Ethereum wallet address" };
        }
        break;
      case 'custom':
        if (!submissionData.text && !submissionData.linkUrl && !submissionData.imageUrl) {
          return { valid: false, message: "Please provide some form of submission (text, link, or image)" };
        }
        break;
    }

    return { valid: true };
  }
}