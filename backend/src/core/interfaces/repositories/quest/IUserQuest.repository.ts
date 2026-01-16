import { IQuest } from "../../../../models/quest.model";
import { IQuestTask } from "../../../../models/questTask.model";
import { IQuestParticipant } from "../../../../models/questParticipant.model";
import { IQuestSubmission } from "../../../../models/questSubmission.model";
import { FilterQuery } from "mongoose";

export interface IParticipantStats {
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  winnerCount: number;
  completionRate: number;
  totalSubmissions: number;
}

export interface IQuestLeaderboardResult {
  participants: (IQuestParticipant & { rank: number })[];
  total: number;
  pages: number;
}

export interface IMyQuestResult {
  quests: (IQuestParticipant & { quest: IQuest })[];
  total: number;
}

export interface IUserQuestRepository {
  // Quest operations
  findAvailableQuests(page: number, limit: number, filters?: FilterQuery<IQuest>): Promise<{ quests: IQuest[]; total: number }>;
  findQuestById(questId: string): Promise<IQuest | null>;
  findTopQuests(limit: number): Promise<IQuest[]>;

  // Participation operations
  findParticipantByUserAndQuest(userId: string, questId: string): Promise<IQuestParticipant | null>;
  createParticipant(participantData: Partial<IQuestParticipant>): Promise<IQuestParticipant>;
  updateParticipant(participantId: string, updateData: Partial<IQuestParticipant>): Promise<IQuestParticipant | null>;
  findMyQuests(userId: string, page: number, limit: number, status?: string): Promise<IMyQuestResult>;

  // Task operations
  findTasksByQuest(questId: string): Promise<IQuestTask[]>;
  findSubmissionByUserTaskQuest(userId: string, taskId: string, questId: string): Promise<IQuestSubmission | null>;
  createSubmission(submissionData: Partial<IQuestSubmission>): Promise<IQuestSubmission>;
  updateSubmission(submissionId: string, updateData: Partial<IQuestSubmission>): Promise<IQuestSubmission | null>;
  findSubmissionsByUserAndQuest(userId: string, questId: string): Promise<IQuestSubmission[]>;

  // Enhanced analytics
  getQuestParticipantStats(questId: string): Promise<IParticipantStats>;
  getQuestLeaderboard(questId: string, page: number, limit: number): Promise<IQuestLeaderboardResult>;
  questSupportsLeaderboard(questId: string): Promise<boolean>;
  getTaskCompletionStats(questId: string): Promise<{ taskId: string; completedBy: number; totalParticipants: number; completionRate: number }[]>;
  getUserRank(userId: string, questId: string): Promise<number>;

  // Validation
  validateTaskSubmission(taskId: string, submissionData: IQuestSubmission['submissionData']): Promise<{ valid: boolean; message?: string }>;
  updateParticipantPrivilegePoints(participantId: string, questId: string): Promise<void>;

  // Updates
  incrementQuestParticipants(questId: string): Promise<void>;
  incrementTaskCompletions(taskId: string): Promise<void>;
}