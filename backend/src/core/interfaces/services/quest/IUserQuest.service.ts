import {
  GetAvailableQuestsDto,
  JoinQuestDto,
  SubmitTaskDto,
  GetMyQuestsDto,
  QuestResponseDto,
  MyQuestResponseDto,
  TaskSubmissionResponseDto,
  LeaderboardResponseDto,
  GetLeaderboardDto,
  QuestTaskStatusDto,
  ParticipationStatusResponseDto
} from "../../../../dtos/quest/UserQuest.dto";

import { IQuestTask } from "../../../../models/questTask.model";
import { IQuestSubmission } from "../../../../models/questSubmission.model";
import { IQuestParticipant } from "../../../../models/questParticipant.model";

export interface IUserQuestService {
  getAvailableQuests(userId: string, query: GetAvailableQuestsDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }>;
  getQuestById(questId: string, userId?: string): Promise<QuestResponseDto>;
  getMyQuests(userId: string, query: GetMyQuestsDto): Promise<{ quests: MyQuestResponseDto[]; total: number; pages: number }>;
  joinQuest(userId: string, joinDto: JoinQuestDto): Promise<{ success: boolean; message: string }>;
  submitTask(userId: string, submitDto: SubmitTaskDto): Promise<TaskSubmissionResponseDto>;
  getQuestTasks(questId: string, userId: string): Promise<QuestTaskStatusDto[]>;
  getMySubmissions(userId: string, questId: string): Promise<IQuestSubmission[]>;
  getQuestStats(questId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    taskCompletionStats: Array<{
      taskId: string;
      completedBy: number;
      totalParticipants: number;
      completionRate: number;
    }>
  }>;
  getTopQuests(limit?: number): Promise<QuestResponseDto[]>;
  checkParticipationStatus(userId: string, questId: string): Promise<ParticipationStatusResponseDto>;
  getQuestLeaderboard(questId: string, query: GetLeaderboardDto): Promise<LeaderboardResponseDto>;
  uploadTaskMedia(file: Express.Multer.File, userId: string): Promise<{ mediaUrl: string }>;
}