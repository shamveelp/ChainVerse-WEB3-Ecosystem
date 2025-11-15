import { injectable } from "inversify";
import { ICommunityAdminQuestRepository } from "../../core/interfaces/repositories/quest/ICommunityAdminQuestRepository";
import QuestModel, { IQuest } from "../../models/quest.model";
import QuestTaskModel, { IQuestTask } from "../../models/questTask.model";
import QuestParticipantModel, { IQuestParticipant } from "../../models/questParticipant.model";
import QuestSubmissionModel, { IQuestSubmission } from "../../models/questSubmission.model";

@injectable()
export class CommunityAdminQuestRepository implements ICommunityAdminQuestRepository {
  // Quest CRUD operations
  async createQuest(questData: Partial<IQuest>): Promise<IQuest> {
    const quest = new QuestModel(questData);
    return await quest.save();
  }

  async findQuestById(questId: string): Promise<IQuest | null> {
    return await QuestModel.findById(questId)
      .populate('communityId', 'name logo')
      .populate('communityAdminId', 'name email')
      .lean();
  }

  async findQuestsByCommunity(
    communityId: string, 
    page: number, 
    limit: number, 
    status?: string
  ): Promise<{ quests: IQuest[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { communityId };
    
    if (status) {
      filter.status = status;
    }

    const [quests, total] = await Promise.all([
      QuestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('communityAdminId', 'name')
        .lean(),
      QuestModel.countDocuments(filter)
    ]);

    return { quests, total };
  }

  async updateQuest(questId: string, updateData: Partial<IQuest>): Promise<IQuest | null> {
    return await QuestModel.findByIdAndUpdate(
      questId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async deleteQuest(questId: string): Promise<boolean> {
    const result = await QuestModel.findByIdAndDelete(questId);
    return !!result;
  }

  // Quest Task operations
  async createQuestTask(taskData: Partial<IQuestTask>): Promise<IQuestTask> {
    const task = new QuestTaskModel(taskData);
    return await task.save();
  }

  async findTasksByQuest(questId: string): Promise<IQuestTask[]> {
    return await QuestTaskModel.find({ questId })
      .sort({ order: 1 })
      .lean();
  }

  async updateQuestTask(taskId: string, updateData: Partial<IQuestTask>): Promise<IQuestTask | null> {
    return await QuestTaskModel.findByIdAndUpdate(
      taskId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async deleteQuestTask(taskId: string): Promise<boolean> {
    const result = await QuestTaskModel.findByIdAndDelete(taskId);
    return !!result;
  }

  async deleteTasksByQuest(questId: string): Promise<number> {
    const result = await QuestTaskModel.deleteMany({ questId });
    return result.deletedCount || 0;
  }

  // Quest Participant operations
  async createParticipant(participantData: Partial<IQuestParticipant>): Promise<IQuestParticipant> {
    const participant = new QuestParticipantModel(participantData);
    return await participant.save();
  }

  async findParticipantsByQuest(
    questId: string, 
    page: number, 
    limit: number, 
    status?: string
  ): Promise<{ participants: IQuestParticipant[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { questId };
    
    if (status) {
      filter.status = status;
    }

    const [participants, total] = await Promise.all([
      QuestParticipantModel.find(filter)
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username name profilePic email')
        .lean(),
      QuestParticipantModel.countDocuments(filter)
    ]);

    return { participants, total };
  }

  async findParticipant(questId: string, userId: string): Promise<IQuestParticipant | null> {
    return await QuestParticipantModel.findOne({ questId, userId })
      .populate('userId', 'username name profilePic')
      .lean();
  }

  async updateParticipant(participantId: string, updateData: Partial<IQuestParticipant>): Promise<IQuestParticipant | null> {
    return await QuestParticipantModel.findByIdAndUpdate(
      participantId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async selectWinners(questId: string, participantIds: string[]): Promise<number> {
    const result = await QuestParticipantModel.updateMany(
      { _id: { $in: participantIds } },
      { 
        $set: { 
          isWinner: true, 
          status: 'winner',
          updatedAt: new Date()
        } 
      }
    );
    return result.modifiedCount || 0;
  }

  // Quest Submission operations
  async createSubmission(submissionData: Partial<IQuestSubmission>): Promise<IQuestSubmission> {
    const submission = new QuestSubmissionModel(submissionData);
    return await submission.save();
  }

  async findSubmissionsByQuest(
    questId: string, 
    page: number, 
    limit: number, 
    status?: string
  ): Promise<{ submissions: IQuestSubmission[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { questId };
    
    if (status) {
      filter.status = status;
    }

    const [submissions, total] = await Promise.all([
      QuestSubmissionModel.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username name profilePic')
        .populate('taskId', 'title taskType')
        .lean(),
      QuestSubmissionModel.countDocuments(filter)
    ]);

    return { submissions, total };
  }

  async findSubmissionsByTask(
    taskId: string, 
    page: number, 
    limit: number
  ): Promise<{ submissions: IQuestSubmission[]; total: number }> {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      QuestSubmissionModel.find({ taskId })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username name profilePic')
        .lean(),
      QuestSubmissionModel.countDocuments({ taskId })
    ]);

    return { submissions, total };
  }

  async findSubmission(questId: string, taskId: string, userId: string): Promise<IQuestSubmission | null> {
    return await QuestSubmissionModel.findOne({ questId, taskId, userId }).lean();
  }

  async updateSubmission(submissionId: string, updateData: Partial<IQuestSubmission>): Promise<IQuestSubmission | null> {
    return await QuestSubmissionModel.findByIdAndUpdate(
      submissionId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  // Analytics and Stats
  async getQuestStats(questId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    completedParticipants: number;
    pendingReviews: number;
  }> {
    const [totalParticipants, totalSubmissions, completedParticipants, pendingReviews] = await Promise.all([
      QuestParticipantModel.countDocuments({ questId }),
      QuestSubmissionModel.countDocuments({ questId }),
      QuestParticipantModel.countDocuments({ questId, status: 'completed' }),
      QuestSubmissionModel.countDocuments({ questId, status: 'pending' })
    ]);

    return {
      totalParticipants,
      totalSubmissions,
      completedParticipants,
      pendingReviews
    };
  }

  async getCommunityQuestStats(communityId: string): Promise<{
    totalQuests: number;
    activeQuests: number;
    endedQuests: number;
    totalParticipants: number;
  }> {
    const [totalQuests, activeQuests, endedQuests] = await Promise.all([
      QuestModel.countDocuments({ communityId }),
      QuestModel.countDocuments({ communityId, status: 'active' }),
      QuestModel.countDocuments({ communityId, status: 'ended' })
    ]);

    // Get total participants across all quests in this community
    const participantsAggregation = await QuestModel.aggregate([
      { $match: { communityId } },
      { $group: { _id: null, totalParticipants: { $sum: '$totalParticipants' } } }
    ]);

    const totalParticipants = participantsAggregation[0]?.totalParticipants || 0;

    return {
      totalQuests,
      activeQuests,
      endedQuests,
      totalParticipants
    };
  }
}