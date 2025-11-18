import { 
  GetAvailableQuestsDto,
  JoinQuestDto,
  SubmitTaskDto,
  GetMyQuestsDto,
  QuestResponseDto,
  MyQuestResponseDto,
  TaskSubmissionResponseDto
} from "../../../../dtos/quest/UserQuest.dto";

export interface IUserQuestService {
  getAvailableQuests(userId: string, query: GetAvailableQuestsDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }>;
  getQuestById(questId: string, userId?: string): Promise<QuestResponseDto>;
  getMyQuests(userId: string, query: GetMyQuestsDto): Promise<{ quests: MyQuestResponseDto[]; total: number; pages: number }>;
  joinQuest(userId: string, joinDto: JoinQuestDto): Promise<{ success: boolean; message: string }>;
  submitTask(userId: string, submitDto: SubmitTaskDto): Promise<TaskSubmissionResponseDto>;
  getQuestTasks(questId: string, userId: string): Promise<any[]>;
  getMySubmissions(userId: string, questId: string): Promise<any[]>;
  getQuestStats(questId: string): Promise<any>;
  getTopQuests(limit?: number): Promise<QuestResponseDto[]>;
  checkParticipationStatus(userId: string, questId: string): Promise<any>;
  getQuestLeaderboard(questId: string): Promise<any[]>;
  uploadTaskMedia(file: Express.Multer.File, userId: string): Promise<{ mediaUrl: string }>;
}