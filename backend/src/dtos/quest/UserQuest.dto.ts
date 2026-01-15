import { IsString, IsNumber, IsEnum, IsOptional, ValidateNested, Min, Max } from "class-validator";
import { Type, Transform } from "class-transformer";
import { BaseResponseDto } from "../base/BaseResponse.dto";

// Get Available Quests Query DTO
export class GetAvailableQuestsDto {
  @Transform(({ value }) => parseInt(value) || 1)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value) || 12)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 12;

  @IsEnum(['draft', 'active', 'ended'])
  @IsOptional()
  status?: 'draft' | 'active' | 'ended' = 'active';

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  communityId?: string;

  @IsEnum(['startDate', 'endDate', 'participantLimit', 'totalParticipants', 'createdAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsEnum(['token', 'nft', 'points', 'custom'])
  @IsOptional()
  rewardType?: 'token' | 'nft' | 'points' | 'custom';
}

// Get My Quests Query DTO
export class GetMyQuestsDto {
  @Transform(({ value }) => parseInt(value) || 1)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value) || 12)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 12;

  @IsEnum(['registered', 'in_progress', 'completed', 'winner', 'disqualified'])
  @IsOptional()
  status?: 'registered' | 'in_progress' | 'completed' | 'winner' | 'disqualified';

  @IsString()
  @IsOptional()
  search?: string;
}

// Get Leaderboard Query DTO
export class GetLeaderboardDto {
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
}

// Join Quest DTO
export class JoinQuestDto {
  @IsString()
  questId!: string;

  @IsString()
  @IsOptional()
  walletAddress?: string;
}

export class TaskSubmissionDataDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsString()
  @IsOptional()
  transactionHash?: string;

  @IsString()
  @IsOptional()
  communityId?: string;

  @IsString()
  @IsOptional()
  targetUserId?: string;
}

// Submit Task DTO
export class SubmitTaskDto {
  @IsString()
  questId!: string;

  @IsString()
  taskId!: string;

  @ValidateNested()
  @Type(() => TaskSubmissionDataDto)
  submissionData!: TaskSubmissionDataDto;
}

// Response DTOs
export class QuestResponseDto extends BaseResponseDto {
  _id: string;
  communityId: any;
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
  community?: {
    communityName: string;
    logo: string;
    username: string;
  };
  isParticipating?: boolean;
  participationStatus?: string;
  completedTasks?: number;
  canJoin?: boolean;
  joinMessage?: string;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    hasEnded: boolean;
  };

  constructor(quest: any, isParticipating = false, participationData?: any) {
    super(true, "Quest retrieved successfully");
    this._id = quest._id.toString();
    this.communityId = quest.communityId;
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
    this.tasks = quest.tasks;
    this.community = quest.community;
    this.isParticipating = isParticipating;
    this.participationStatus = participationData?.status;
    this.completedTasks = participationData?.totalTasksCompleted || 0;

    // Calculate if user can join and join message
    this.canJoin = this.calculateCanJoin();
    this.joinMessage = this.calculateJoinMessage();
    this.timeRemaining = this.calculateTimeRemaining();
  }

  private calculateCanJoin(): boolean {
    if (this.isParticipating) return false;
    if (this.status !== 'active') return false;
    if (this.totalParticipants >= this.participantLimit) return false;

    const now = new Date();
    const endDate = new Date(this.endDate);
    if (endDate <= now) return false;

    return true;
  }

  private calculateJoinMessage(): string {
    if (this.isParticipating) return "You're already participating in this quest";
    if (this.status === 'ended') return "This quest has ended";
    if (this.status === 'draft') return "This quest is still in draft mode";
    if (this.status === 'cancelled') return "This quest has been cancelled";
    if (this.totalParticipants >= this.participantLimit) return "Quest is full - no more participants allowed";

    const now = new Date();
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    if (startDate > now) return "Quest hasn't started yet";
    if (endDate <= now) return "Quest has ended";

    return "Join this quest to start earning rewards!";
  }

  private calculateTimeRemaining(): { days: number; hours: number; minutes: number; hasEnded: boolean } {
    const now = new Date();
    const endDate = new Date(this.endDate);
    const timeDiff = endDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { days: 0, hours: 0, minutes: 0, hasEnded: true };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, hasEnded: false };
  }
}

export class MyQuestResponseDto extends BaseResponseDto {
  _id: string;
  questId: string;
  quest: any;
  status: string;
  joinedAt: Date;
  completedAt?: Date;
  totalTasksCompleted: number;
  isWinner: boolean;
  rewardClaimed: boolean;
  progress: number;

  constructor(participation: any) {
    super(true, "My quest retrieved successfully");
    this._id = participation._id.toString();
    this.questId = participation.questId.toString();
    this.quest = participation.quest;
    this.status = participation.status;
    this.joinedAt = participation.joinedAt;
    this.completedAt = participation.completedAt;
    this.totalTasksCompleted = participation.totalTasksCompleted;
    this.isWinner = participation.isWinner;
    this.rewardClaimed = participation.rewardClaimed;
    this.progress = participation.quest?.tasks?.length > 0 ?
      (participation.totalTasksCompleted / participation.quest.tasks.length) * 100 : 0;
  }
}

export class TaskSubmissionResponseDto extends BaseResponseDto {
  _id: string;
  questId: string;
  taskId: string;
  submissionData: any;
  status: string;
  submittedAt: Date;

  constructor(submission: any) {
    super(true, "Task submitted successfully");
    this._id = submission._id.toString();
    this.questId = submission.questId.toString();
    this.taskId = submission.taskId.toString();
    this.submissionData = submission.submissionData;
    this.status = submission.status;
    this.submittedAt = submission.submittedAt;
  }
}

export class LeaderboardResponseDto extends BaseResponseDto {
  participants: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  constructor(data: any) {
    super(true, "Leaderboard retrieved successfully");
    this.participants = data.participants || [];
    this.pagination = data.pagination;
  }
}

export class ParticipationStatusResponseDto {
  isParticipating!: boolean;
  participation?: any;
  rank?: number | null;
  canJoin?: boolean;
  message?: string;
}

export class QuestTaskStatusDto {
  _id!: string;
  questId!: string;
  title!: string;
  description!: string;
  taskType!: string;
  isRequired!: boolean;
  order!: number;
  privilegePoints!: number;
  config!: any;
  isCompleted!: boolean;
  submission!: any;
  canSubmit!: boolean;
}