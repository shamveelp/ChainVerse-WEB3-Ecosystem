import { injectable } from "inversify";
import { ICommunityAdminQuestRepository } from "../../core/interfaces/repositories/quest/ICommunityAdminQuestRepository";
import QuestModel, { IQuest } from "../../models/quest.model";
import QuestTaskModel, { IQuestTask } from "../../models/questTask.model";
import QuestParticipantModel, { IQuestParticipant } from "../../models/questParticipant.model";
import QuestSubmissionModel, { IQuestSubmission } from "../../models/questSubmission.model";
import { PointsHistoryModel } from "../../models/pointsHistory.model";
import { UserModel } from "../../models/user.models";
import mongoose from "mongoose";

@injectable()
export class CommunityAdminQuestRepository implements ICommunityAdminQuestRepository {
  // Quest CRUD operations
  async createQuest(questData: Partial<IQuest>): Promise<IQuest> {
    const quest = new QuestModel(questData);
    return await quest.save();
  }

  async findQuestById(questId: string): Promise<IQuest | null> {
    return await QuestModel.findById(questId)
      .populate('communityId', 'communityName logo')
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

  // Enhanced winner selection methods
  async getQualifiedParticipants(questId: string): Promise<IQuestParticipant[]> {
    return await QuestParticipantModel.find({
      questId,
      status: { $in: ['completed'] },
      $expr: {
        $ne: ['$status', 'disqualified']
      }
    })
    .populate('userId', 'username name profilePic email')
    .lean();
  }

  async getParticipantsByFCFS(questId: string, limit: number): Promise<IQuestParticipant[]> {
    return await QuestParticipantModel.find({
      questId,
      status: 'completed'
    })
    .sort({ completedAt: 1 }) // First completed first
    .limit(limit)
    .populate('userId', 'username name profilePic email')
    .lean();
  }

  async getParticipantsByLeaderboard(questId: string, limit: number): Promise<IQuestParticipant[]> {
    return await QuestParticipantModel.find({
      questId,
      status: 'completed'
    })
    .sort({ 
      totalPrivilegePoints: -1, // Highest points first
      completedAt: 1 // Then by completion time
    })
    .limit(limit)
    .populate('userId', 'username name profilePic email')
    .lean();
  }

  async getRandomParticipants(questId: string, limit: number): Promise<IQuestParticipant[]> {
    const participants = await QuestParticipantModel.aggregate([
      { $match: { questId: new mongoose.Types.ObjectId(questId), status: 'completed' } },
      { $sample: { size: limit } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userId' } },
      { $unwind: '$userId' }
    ]);
    return participants;
  }

  // Reward distribution
  async distributeRewards(questId: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get quest details
      const quest = await QuestModel.findById(questId).session(session);
      if (!quest) throw new Error("Quest not found");

      // Get winners
      const winners = await QuestParticipantModel.find({
        questId,
        isWinner: true,
        rewardClaimed: false
      }).populate('userId').session(session);

      if (winners.length === 0) {
        await session.abortTransaction();
        return false;
      }

      // Calculate reward per winner
      const rewardPerWinner = Math.floor(quest.rewardPool.amount / winners.length);

      // Update user points and create history records
      const updatePromises = winners.map(async (winner) => {
        // Update user points
        await UserModel.findByIdAndUpdate(
          winner.userId._id,
          { $inc: { totalPoints: rewardPerWinner } },
          { session }
        );

        // Create points history record
        await PointsHistoryModel.create([{
          userId: winner.userId._id,
          type: 'quest_reward',
          points: rewardPerWinner,
          description: `Quest reward: ${quest.title}`,
          relatedId: questId
        }], { session });

        // Mark reward as claimed
        await QuestParticipantModel.findByIdAndUpdate(
          winner._id,
          {
            rewardClaimed: true,
            rewardClaimedAt: new Date()
          },
          { session }
        );
      });

      await Promise.all(updatePromises);

      // Mark quest rewards as distributed
      await QuestModel.findByIdAndUpdate(
        questId,
        { rewardsDistributed: true },
        { session }
      );

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    winnersSelected: number;
    rewardsDistributed: boolean;
  }> {
    const [totalParticipants, totalSubmissions, completedParticipants, pendingReviews, winnersSelected, quest] = await Promise.all([
      QuestParticipantModel.countDocuments({ questId }),
      QuestSubmissionModel.countDocuments({ questId }),
      QuestParticipantModel.countDocuments({ questId, status: 'completed' }),
      QuestSubmissionModel.countDocuments({ questId, status: 'pending' }),
      QuestParticipantModel.countDocuments({ questId, isWinner: true }),
      QuestModel.findById(questId, 'rewardsDistributed')
    ]);

    return {
      totalParticipants,
      totalSubmissions,
      completedParticipants,
      pendingReviews,
      winnersSelected,
      rewardsDistributed: quest?.rewardsDistributed || false
    };
  }

  async getCommunityQuestStats(communityId: string): Promise<{
    totalQuests: number;
    activeQuests: number;
    endedQuests: number;
    totalParticipants: number;
    totalRewardsDistributed: number;
  }> {
    const [totalQuests, activeQuests, endedQuests, totalRewardsDistributed] = await Promise.all([
      QuestModel.countDocuments({ communityId }),
      QuestModel.countDocuments({ communityId, status: 'active' }),
      QuestModel.countDocuments({ communityId, status: 'ended' }),
      QuestModel.countDocuments({ communityId, rewardsDistributed: true })
    ]);

    // Get total participants across all quests in this community
    const participantsAggregation = await QuestModel.aggregate([
      { $match: { communityId: new mongoose.Types.ObjectId(communityId) } },
      { $group: { _id: null, totalParticipants: { $sum: '$totalParticipants' } } }
    ]);

    const totalParticipants = participantsAggregation[0]?.totalParticipants || 0;

    return {
      totalQuests,
      activeQuests,
      endedQuests,
      totalParticipants,
      totalRewardsDistributed
    };
  }

  async getQuestLeaderboard(questId: string, limit: number = 10): Promise<any[]> {
    return await QuestParticipantModel.find({ questId })
      .sort({
        totalPrivilegePoints: -1,
        completedAt: 1,
        joinedAt: 1
      })
      .limit(limit)
      .populate('userId', 'username name profilePic')
      .lean();
  }

  async calculateParticipantScore(participantId: string, questId: string): Promise<number> {
    const participant = await QuestParticipantModel.findById(participantId);
    if (!participant) return 0;

    const completedTasksWithPoints = await QuestTaskModel.find({
      _id: { $in: participant.completedTasks },
      questId
    }).select('privilegePoints');

    const totalPoints = completedTasksWithPoints.reduce((sum, task) => sum + task.privilegePoints, 0);
    
    // Update participant's total privilege points
    await QuestParticipantModel.findByIdAndUpdate(participantId, {
      totalPrivilegePoints: totalPoints
    });

    return totalPoints;
  }

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

  async incrementQuestSubmissions(questId: string): Promise<void> {
    await QuestModel.findByIdAndUpdate(questId, {
      $inc: { totalSubmissions: 1 }
    });
  }
}