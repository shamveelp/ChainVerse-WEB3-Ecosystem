import { injectable } from "inversify";
import { IUserQuestRepository } from "../../core/interfaces/repositories/quest/IUserQuest.repository";
import QuestModel, { IQuest } from "../../models/quest.model";
import QuestTaskModel, { IQuestTask } from "../../models/questTask.model";
import QuestParticipantModel, { IQuestParticipant } from "../../models/questParticipant.model";
import QuestSubmissionModel, { IQuestSubmission } from "../../models/questSubmission.model";

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

  // Analytics
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

  async getQuestLeaderboard(questId: string, limit: number): Promise<any[]> {
    return await QuestParticipantModel.find({ questId })
      .sort({ 
        totalTasksCompleted: -1, 
        completedAt: 1,
        joinedAt: 1 
      })
      .limit(limit)
      .populate('userId', 'username name profilePic')
      .lean();
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
}