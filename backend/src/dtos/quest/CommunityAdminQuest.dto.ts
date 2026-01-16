import { IsString, IsNumber, IsEnum, IsBoolean, IsArray, IsOptional, IsDate, ValidateNested, Min, Max } from "class-validator";
import { Type, Transform } from "class-transformer";
import { BaseResponseDto } from "../base/BaseResponse.dto";
import { IQuest } from "../../models/quest.model";

export class RewardPoolDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  currency!: string;

  @IsEnum(['token', 'nft', 'points', 'custom'])
  rewardType!: 'token' | 'nft' | 'points' | 'custom';

  @IsString()
  @IsOptional()
  customReward?: string;
}

export class TaskConfigDto {
  @IsString()
  @IsOptional()
  communityId?: string;

  @IsString()
  @IsOptional()
  communityName?: string;

  @IsString()
  @IsOptional()
  communityUsername?: string;

  @IsString()
  @IsOptional()
  targetUserId?: string;

  @IsString()
  @IsOptional()
  targetUsername?: string;

  @IsString()
  @IsOptional()
  twitterText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  twitterHashtags?: string[];

  @IsString()
  @IsOptional()
  contractAddress?: string;

  @IsString()
  @IsOptional()
  tokenId?: string;

  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @IsNumber()
  @IsOptional()
  minimumAmount?: number;

  @IsString()
  @IsOptional()
  customInstructions?: string;

  @IsBoolean()
  @IsOptional()
  requiresProof?: boolean;

  @IsEnum(['text', 'image', 'link'])
  @IsOptional()
  proofType?: 'text' | 'image' | 'link';

  @IsString()
  @IsOptional()
  websiteUrl?: string;
}

// Quest Task DTO
export class QuestTaskDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(['join_community', 'follow_user', 'twitter_post', 'upload_screenshot', 'nft_mint', 'token_hold', 'wallet_connect', 'custom'])
  taskType!: 'join_community' | 'follow_user' | 'twitter_post' | 'upload_screenshot' | 'nft_mint' | 'token_hold' | 'wallet_connect' | 'custom';

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsNumber()
  order!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  privilegePoints?: number; // New field for leaderboard scoring

  @ValidateNested()
  @Type(() => TaskConfigDto)
  @IsOptional()
  config?: TaskConfigDto;
}

// Create Quest DTO
export class CreateQuestDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsEnum(['fcfs', 'random', 'leaderboard'])
  selectionMethod!: 'fcfs' | 'random' | 'leaderboard';

  @IsNumber()
  @Min(1)
  participantLimit!: number;

  @ValidateNested()
  @Type(() => RewardPoolDto)
  rewardPool!: RewardPoolDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestTaskDto)
  tasks!: QuestTaskDto[];

  @IsBoolean()
  @IsOptional()
  isAIGenerated?: boolean;

  @IsString()
  @IsOptional()
  aiPrompt?: string;
}

// Update Quest DTO
export class UpdateQuestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsEnum(['fcfs', 'random', 'leaderboard'])
  @IsOptional()
  selectionMethod?: 'fcfs' | 'random' | 'leaderboard';

  @IsNumber()
  @Min(1)
  @IsOptional()
  participantLimit?: number;

  @ValidateNested()
  @Type(() => RewardPoolDto)
  @IsOptional()
  rewardPool?: RewardPoolDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestTaskDto)
  @IsOptional()
  tasks?: QuestTaskDto[];

  @IsEnum(['draft', 'active', 'ended', 'cancelled'])
  @IsOptional()
  status?: 'draft' | 'active' | 'ended' | 'cancelled';
}

// Get Quests Query DTO
export class GetQuestsQueryDto {
  @Transform(({ value }) => parseInt(value) || 1)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value) || 10)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsEnum(['draft', 'active', 'ended', 'cancelled'])
  @IsOptional()
  status?: 'draft' | 'active' | 'ended' | 'cancelled';

  @IsString()
  @IsOptional()
  search?: string;
}

// Get Participants Query DTO
export class GetParticipantsQueryDto {
  @Transform(({ value }) => parseInt(value) || 1)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value) || 10)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsEnum(['registered', 'in_progress', 'completed', 'winner', 'disqualified'])
  @IsOptional()
  status?: 'registered' | 'in_progress' | 'completed' | 'winner' | 'disqualified';

  @IsString()
  @IsOptional()
  sortBy?: string = 'joinedAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// AI Quest Generation DTO
export class AIQuestGenerationDto {
  @IsString()
  prompt!: string;

  @IsString()
  @IsOptional()
  communityTheme?: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  expectedWinners?: number = 10;
}

// Select Winners DTO
export class SelectWinnersDto {
  @IsString()
  questId!: string;

  @IsEnum(['fcfs', 'random', 'leaderboard'])
  @IsOptional()
  method?: 'fcfs' | 'random' | 'leaderboard';
}

export class ChatWithAIResponseDto {
  response!: string;
  questGenerated!: boolean;
  questData?: CreateQuestDto;
  needsInput?: Array<{ type: string; field: string; prompt: string }>;
}

// Response DTOs
export class QuestResponseDto extends BaseResponseDto {
  _id: string;
  communityId: string;
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: string;
  participantLimit: number;
  rewardPool: RewardPoolDto;
  status: string;
  totalParticipants: number;
  totalSubmissions: number;
  winnersSelected: boolean;
  rewardsDistributed: boolean;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks?: QuestTaskDto[];

  constructor(quest: IQuest) {
    super(true, "Quest retrieved successfully");
    this._id = quest._id.toString();
    this.communityId = quest.communityId.toString();
    this.title = quest.title;
    this.description = quest.description;
    this.bannerImage = quest.bannerImage;
    this.startDate = quest.startDate;
    this.endDate = quest.endDate;
    this.selectionMethod = quest.selectionMethod;
    this.participantLimit = quest.participantLimit;
    this.rewardPool = quest.rewardPool;
    this.status = quest.status;
    this.totalParticipants = quest.totalParticipants;
    this.totalSubmissions = quest.totalSubmissions;
    this.winnersSelected = quest.winnersSelected;
    this.rewardsDistributed = quest.rewardsDistributed || false;
    this.isAIGenerated = quest.isAIGenerated;
    this.createdAt = quest.createdAt;
    this.updatedAt = quest.updatedAt;
  }
}

export interface IQuestStats {
  totalQuests: number;
  activeQuests: number;
  endedQuests: number;
  totalParticipants: number;
  totalRewardsDistributed?: number;
}

export class QuestStatsResponseDto extends BaseResponseDto {
  totalQuests: number;
  activeQuests: number;
  endedQuests: number;
  totalParticipants: number;
  totalRewardsDistributed: number;

  constructor(stats: IQuestStats) {
    super(true, "Quest stats retrieved successfully");
    this.totalQuests = stats.totalQuests;
    this.activeQuests = stats.activeQuests;
    this.endedQuests = stats.endedQuests;
    this.totalParticipants = stats.totalParticipants;
    this.totalRewardsDistributed = stats.totalRewardsDistributed || 0;
  }
}

export class QuestParticipantResponseDto {
  _id!: string;
  userId!: string;
  username!: string;
  name!: string;
  profilePic?: string;
  status!: string;
  joinedAt!: Date;
  totalTasksCompleted!: number;
  totalPrivilegePoints!: number;
  isWinner!: boolean;
  rewardClaimed!: boolean;
}

export class QuestSubmissionDataDto {
  text?: string;
  imageUrl?: string;
  linkUrl?: string;
  twitterUrl?: string;
  walletAddress?: string;
  transactionHash?: string;
}

export class QuestSubmissionDto {
  _id!: string;
  questId!: string;
  taskId!: string;
  userId!: string;
  submissionData!: QuestSubmissionDataDto;
  status!: string;
  reviewedBy?: string;
  reviewComment?: string;
  submittedAt!: Date;
  reviewedAt?: Date;
}

export class QuestParticipantDetailsDto extends QuestParticipantResponseDto {
  submissions!: QuestSubmissionDto[];
  walletAddress?: string;
}

export class QuestWinnerResponseDto {
  _id!: string;
  userId!: string;
  username!: string;
  name!: string;
  profilePic?: string;
  rewardAmount!: number;
  rewardCurrency!: string;
}