import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class GetCommunityMembersDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit must be at most 50' })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['member', 'moderator', 'admin'], { message: 'Invalid role' })
  role?: 'member' | 'moderator' | 'admin';

  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'], { message: 'Invalid status' })
  status?: 'active' | 'inactive' | 'banned';

  @IsOptional()
  @IsEnum(['recent', 'oldest', 'most_active', 'most_posts'], { message: 'Invalid sort option' })
  sortBy?: 'recent' | 'oldest' | 'most_active' | 'most_posts' = 'recent';
}

export class UpdateMemberRoleDto {
  @IsString({ message: 'Member ID is required' })
  memberId!: string;

  @IsEnum(['member', 'moderator'], { message: 'Invalid role' })
  role!: 'member' | 'moderator';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BanMemberDto {
  @IsString({ message: 'Member ID is required' })
  memberId!: string;

  @IsString({ message: 'Ban reason is required' })
  reason!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(1, { message: 'Duration must be at least 1 day' })
  durationDays?: number; // If not provided, permanent ban
}

export class CommunityMemberDto {
  _id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  isActive: boolean;
  lastActiveAt: Date;
  isPremium: boolean;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
  };
  bannedUntil?: Date;
  banReason?: string;

  constructor(member: any, user: any) {
    this._id = member._id.toString();
    this.userId = user._id.toString();
    this.username = user.username;
    this.name = user.name || user.username;
    this.email = user.email;
    this.profilePic = user.profilePic || '';
    this.role = member.role;
    this.joinedAt = member.joinedAt;
    this.isActive = member.isActive;
    this.lastActiveAt = member.lastActiveAt;
    this.isPremium = member.isPremium;
    this.stats = {
      totalPosts: member.totalPosts || 0,
      totalLikes: member.totalLikes || 0,
      totalComments: member.totalComments || 0,
      questsCompleted: member.questsCompleted || 0
    };
    this.bannedUntil = member.bannedUntil;
    this.banReason = member.banReason;
  }
}

export class CommunityMembersListResponseDto extends BaseResponseDto {
  members: CommunityMemberDto[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  summary: {
    totalMembers: number;
    activeMembers: number;
    moderators: number;
    premiumMembers: number;
    bannedMembers: number;
    newMembersThisWeek: number;
  };

  constructor(members: CommunityMemberDto[], hasMore: boolean, nextCursor: string | undefined, totalCount: number, summary: any) {
    super(true, 'Community members retrieved successfully');
    this.members = members;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
    this.totalCount = totalCount;
    this.summary = summary;
  }
}

export class MemberActionResponseDto extends BaseResponseDto {
  member: CommunityMemberDto;
  
  constructor(member: CommunityMemberDto, message: string) {
    super(true, message);
    this.member = member;
  }
}