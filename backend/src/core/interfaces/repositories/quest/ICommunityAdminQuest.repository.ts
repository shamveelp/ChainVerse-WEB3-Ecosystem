import { IQuest } from "../../../../models/quest.model";
import { IQuestTask } from "../../../../models/questTask.model";
import { IQuestParticipant } from "../../../../models/questParticipant.model";
import { IQuestSubmission } from "../../../../models/questSubmission.model";

export interface ICommunityAdminQuestRepository {
  // Quest CRUD operations
  createQuest(questData: Partial<IQuest>): Promise<IQuest>;
  findQuestById(questId: string): Promise<IQuest | null>;
  findQuestsByCommunity(
    communityId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ quests: IQuest[]; total: number }>;
  updateQuest(questId: string, updateData: Partial<IQuest>): Promise<IQuest | null>;
  deleteQuest(questId: string): Promise<boolean>;

  // Quest Task operations
  createQuestTask(taskData: Partial<IQuestTask>): Promise<IQuestTask>;
  findTasksByQuest(questId: string): Promise<IQuestTask[]>;
  updateQuestTask(taskId: string, updateData: Partial<IQuestTask>): Promise<IQuestTask | null>;
  deleteQuestTask(taskId: string): Promise<boolean>;
  deleteTasksByQuest(questId: string): Promise<number>;

  // Quest Participant operations
  createParticipant(participantData: Partial<IQuestParticipant>): Promise<IQuestParticipant>;
  findParticipantsByQuest(
    questId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ participants: IQuestParticipant[]; total: number }>;
  findParticipant(questId: string, userId: string): Promise<IQuestParticipant | null>;
  updateParticipant(
    participantId: string,
    updateData: Partial<IQuestParticipant>
  ): Promise<IQuestParticipant | null>;
  selectWinners(questId: string, participantIds: string[]): Promise<number>;

  // Enhanced winner selection methods
  getQualifiedParticipants(questId: string): Promise<IQuestParticipant[]>;
  getParticipantsByFCFS(questId: string, limit: number): Promise<IQuestParticipant[]>;
  getParticipantsByLeaderboard(questId: string, limit: number): Promise<IQuestParticipant[]>;
  getRandomParticipants(questId: string, limit: number): Promise<IQuestParticipant[]>;

  // Reward distribution
  distributeRewards(questId: string): Promise<boolean>;

  // Quest Submission operations
  createSubmission(submissionData: Partial<IQuestSubmission>): Promise<IQuestSubmission>;
  findSubmissionsByQuest(
    questId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ submissions: IQuestSubmission[]; total: number }>;
  findSubmissionsByUserAndQuest(
    userId: string,
    questId: string
  ): Promise<IQuestSubmission[]>;
  findSubmissionsByTask(
    taskId: string,
    page: number,
    limit: number
  ): Promise<{ submissions: IQuestSubmission[]; total: number }>;
  findSubmission(
    questId: string,
    taskId: string,
    userId: string
  ): Promise<IQuestSubmission | null>;
  updateSubmission(
    submissionId: string,
    updateData: Partial<IQuestSubmission>
  ): Promise<IQuestSubmission | null>;

  // Analytics and Stats
  getQuestStats(questId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    completedParticipants: number;
    pendingReviews: number;
    winnersSelected: number;
    rewardsDistributed: boolean;
  }>;

  getCommunityQuestStats(communityId: string): Promise<{
    totalQuests: number;
    activeQuests: number;
    endedQuests: number;
    totalParticipants: number;
    totalRewardsDistributed: number;
  }>;

  getQuestLeaderboard(questId: string, limit?: number): Promise<IQuestParticipant[]>;

  // Utility / Counter methods
  calculateParticipantScore(participantId: string, questId: string): Promise<number>;
  incrementQuestParticipants(questId: string): Promise<void>;
  incrementTaskCompletions(taskId: string): Promise<void>;
  incrementQuestSubmissions(questId: string): Promise<void>;
}