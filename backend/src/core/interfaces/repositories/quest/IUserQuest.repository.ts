import { IQuest } from "../../../../models/quest.model";
import { IQuestTask } from "../../../../models/questTask.model";
import { IQuestParticipant } from "../../../../models/questParticipant.model";
import { IQuestSubmission } from "../../../../models/questSubmission.model";

export interface IUserQuestRepository {
  // Quest operations
  findAvailableQuests(page: number, limit: number, filters?: any): Promise<{ quests: IQuest[]; total: number }>;
  findQuestById(questId: string): Promise<IQuest | null>;
  findTopQuests(limit: number): Promise<IQuest[]>;
  
  // Participation operations
  findParticipantByUserAndQuest(userId: string, questId: string): Promise<IQuestParticipant | null>;
  createParticipant(participantData: Partial<IQuestParticipant>): Promise<IQuestParticipant>;
  updateParticipant(participantId: string, updateData: Partial<IQuestParticipant>): Promise<IQuestParticipant | null>;
  findMyQuests(userId: string, page: number, limit: number, status?: string): Promise<{ quests: any[]; total: number }>;
  
  // Task operations
  findTasksByQuest(questId: string): Promise<IQuestTask[]>;
  findSubmissionByUserTaskQuest(userId: string, taskId: string, questId: string): Promise<IQuestSubmission | null>;
  createSubmission(submissionData: Partial<IQuestSubmission>): Promise<IQuestSubmission>;
  updateSubmission(submissionId: string, updateData: Partial<IQuestSubmission>): Promise<IQuestSubmission | null>;
  findSubmissionsByUserAndQuest(userId: string, questId: string): Promise<IQuestSubmission[]>;
  
  // Analytics
  getQuestParticipantStats(questId: string): Promise<any>;
  getQuestLeaderboard(questId: string, limit: number): Promise<any[]>;
  
  // Updates
  incrementQuestParticipants(questId: string): Promise<void>;
  incrementTaskCompletions(taskId: string): Promise<void>;
}