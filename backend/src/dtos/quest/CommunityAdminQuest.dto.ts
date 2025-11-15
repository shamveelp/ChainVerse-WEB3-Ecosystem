import { IsString, IsNumber, IsEnum, IsBoolean, IsArray, IsOptional, IsDate, ValidateNested, Min, Max } from "class-validator";
import { Type, Transform } from "class-transformer";
import { BaseResponseDto } from "../base/BaseResponse.dto";


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

  @IsEnum(['fcfs', 'random'])
  selectionMethod!: 'fcfs' | 'random';

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

  @IsEnum(['fcfs', 'random'])
  @IsOptional()
  selectionMethod?: 'fcfs' | 'random';

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

// Reward Pool DTO

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

  @ValidateNested()
  @Type(() => TaskConfigDto)
  @IsOptional()
  config?: TaskConfigDto;
}

// Task Configuration DTO


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

  @IsEnum(['fcfs', 'random'])
  @IsOptional()
  method?: 'fcfs' | 'random';
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
  rewardPool: any;
  status: string;
  totalParticipants: number;
  totalSubmissions: number;
  winnersSelected: boolean;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks?: any[];

  constructor(quest: any) {
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
    this.isAIGenerated = quest.isAIGenerated;
    this.createdAt = quest.createdAt;
    this.updatedAt = quest.updatedAt;
  }
}

export class QuestStatsResponseDto extends BaseResponseDto {
  totalQuests: number;
  activeQuests: number;
  endedQuests: number;
  totalParticipants: number;

  constructor(stats: any) {
    super(true, "Quest stats retrieved successfully");
    this.totalQuests = stats.totalQuests;
    this.activeQuests = stats.activeQuests;
    this.endedQuests = stats.endedQuests;
    this.totalParticipants = stats.totalParticipants;
  }
}