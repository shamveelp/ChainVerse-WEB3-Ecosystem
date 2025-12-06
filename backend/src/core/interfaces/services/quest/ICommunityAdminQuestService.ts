import { 
  CreateQuestDto, 
  UpdateQuestDto, 
  GetQuestsQueryDto, 
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto,
  QuestResponseDto,
  QuestStatsResponseDto
} from "../../../../dtos/quest/CommunityAdminQuest.dto";

export interface ICommunityAdminQuestService {
  // Quest CRUD operations
  createQuest(communityAdminId: string, createDto: CreateQuestDto): Promise<QuestResponseDto>;
  getQuestById(questId: string, communityAdminId: string): Promise<QuestResponseDto>;
  getQuests(communityAdminId: string, query: GetQuestsQueryDto): Promise<{ quests: QuestResponseDto[]; total: number; pages: number }>;
  updateQuest(questId: string, communityAdminId: string, updateDto: UpdateQuestDto): Promise<QuestResponseDto>;
  deleteQuest(questId: string, communityAdminId: string): Promise<boolean>;

  // AI-powered quest generation
  generateQuestWithAI(communityAdminId: string, aiDto: AIQuestGenerationDto): Promise<CreateQuestDto>;

  // Participant management
  getQuestParticipants(questId: string, communityAdminId: string, query: GetParticipantsQueryDto): Promise<{ participants: any[]; total: number; pages: number }>;   
  getParticipantDetails(questId: string, participantId: string, communityAdminId: string): Promise<any>;
  selectWinners(communityAdminId: string, selectDto: SelectWinnersDto): Promise<{ winners: any[]; message: string }>;
  selectReplacementWinners(questId: string, communityAdminId: string, count: number): Promise<{ winners: any[]; message: string }>;
  disqualifyParticipant(questId: string, participantId: string, reason: string, communityAdminId: string): Promise<boolean>;

  // Reward distribution
  distributeRewards(questId: string, communityAdminId: string): Promise<{ success: boolean; message: string; winnersRewarded: number }>;

  // Quest analytics and stats
  getQuestStats(questId: string, communityAdminId: string): Promise<any>;
  getCommunityQuestStats(communityAdminId: string): Promise<QuestStatsResponseDto>;
  getQuestLeaderboard(questId: string, communityAdminId: string): Promise<any[]>;

  // Quest status management
  startQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto>;
  endQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto>;

  // File upload
  uploadQuestBanner(questId: string, file: Express.Multer.File, communityAdminId: string): Promise<{ bannerUrl: string }>;
}