import {
  CreateQuestDto,
  UpdateQuestDto,
  GetQuestsQueryDto,
  GetParticipantsQueryDto,
  AIQuestGenerationDto,
  SelectWinnersDto,
  QuestResponseDto,
  QuestStatsResponseDto,
  QuestParticipantResponseDto,
  QuestParticipantDetailsDto,
  QuestWinnerResponseDto,
  ChatWithAIResponseDto
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
  chatWithAI(communityAdminId: string, message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<ChatWithAIResponseDto>;

  // Participant management
  getQuestParticipants(questId: string, communityAdminId: string, query: GetParticipantsQueryDto): Promise<{ participants: QuestParticipantResponseDto[]; total: number; pages: number }>;
  getParticipantDetails(questId: string, participantId: string, communityAdminId: string): Promise<QuestParticipantDetailsDto>;
  selectWinners(communityAdminId: string, selectDto: SelectWinnersDto): Promise<{ winners: QuestWinnerResponseDto[]; message: string }>;
  selectReplacementWinners(questId: string, communityAdminId: string, count: number): Promise<{ winners: QuestWinnerResponseDto[]; message: string }>;
  disqualifyParticipant(questId: string, participantId: string, reason: string, communityAdminId: string): Promise<boolean>;

  // Reward distribution
  distributeRewards(questId: string, communityAdminId: string): Promise<{ success: boolean; message: string; winnersRewarded: number }>;

  // Quest analytics and stats
  getQuestStats(questId: string, communityAdminId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    completedParticipants: number;
    pendingReviews: number;
    winnersSelected: number;
    rewardsDistributed: boolean;
  }>;
  getCommunityQuestStats(communityAdminId: string): Promise<QuestStatsResponseDto>;
  getQuestLeaderboard(questId: string, communityAdminId: string): Promise<QuestParticipantResponseDto[]>;

  // Quest status management
  startQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto>;
  endQuest(questId: string, communityAdminId: string): Promise<QuestResponseDto>;

  // File upload
  uploadQuestBanner(questId: string, file: Express.Multer.File, communityAdminId: string): Promise<{ bannerUrl: string }>;
}