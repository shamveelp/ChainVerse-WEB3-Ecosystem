import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
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

export class CommunityMemberDetailDto {
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
  permissions: {
    canPost: boolean;
    canComment: boolean;
    canModerate: boolean;
    canManageMembers: boolean;
    canEditCommunity: boolean;
  };
  bannedUntil?: Date;
  banReason?: string;
  bannedBy?: {
    _id: string;
    name: string;
  };
  activityLevel: 'very_active' | 'active' | 'moderate' | 'inactive';
  joinSource: string;
  totalWarnings: number;

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
    this.permissions = this.getPermissions(member.role);
    this.bannedUntil = member.bannedUntil;
    this.banReason = member.banReason;
    this.bannedBy = member.bannedBy ? {
      _id: member.bannedBy._id?.toString(),
      name: member.bannedBy.name
    } : undefined;
    this.activityLevel = this.calculateActivityLevel(member);
    this.joinSource = member.joinSource || 'direct';
    this.totalWarnings = member.totalWarnings || 0;
  }

  private getPermissions(role: string) {
    switch (role) {
      case 'admin':
        return {
          canPost: true,
          canComment: true,
          canModerate: true,
          canManageMembers: true,
          canEditCommunity: true
        };
      case 'moderator':
        return {
          canPost: true,
          canComment: true,
          canModerate: true,
          canManageMembers: true,
          canEditCommunity: false
        };
      default:
        return {
          canPost: true,
          canComment: true,
          canModerate: false,
          canManageMembers: false,
          canEditCommunity: false
        };
    }
  }

  private calculateActivityLevel(member: any): 'very_active' | 'active' | 'moderate' | 'inactive' {
    const daysSinceJoined = (Date.now() - new Date(member.joinedAt).getTime()) / (1000 * 60 * 60 * 24);
    const totalPosts = member.totalPosts || 0;
    const postsPerDay = daysSinceJoined > 0 ? totalPosts / daysSinceJoined : 0;

    if (postsPerDay >= 1) return 'very_active';
    if (postsPerDay >= 0.5) return 'active';
    if (postsPerDay >= 0.1) return 'moderate';
    return 'inactive';
  }
}

// Keep existing DTOs and add new ones
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
  durationDays?: number;
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

export class MemberDetailResponseDto extends BaseResponseDto {
  member: CommunityMemberDetailDto;

  constructor(member: CommunityMemberDetailDto, message: string = 'Member details retrieved successfully') {
    super(true, message);
    this.member = member;
  }
}
