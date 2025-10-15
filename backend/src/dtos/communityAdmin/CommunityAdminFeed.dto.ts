import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class GetCommunityFeedDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit must be at most 50' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  type?: 'all' | 'trending' | 'recent' = 'all';
}

export class CommunityFeedResponseDto extends BaseResponseDto {
  posts: any[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  communityStats: {
    totalMembers: number;
    activeMembersToday: number;
    postsToday: number;
    engagementRate: number;
  };

  constructor(posts: any[], hasMore: boolean, nextCursor?: string, totalCount: number = 0, communityStats?: any) {
    super(true, 'Community feed retrieved successfully');
    this.posts = posts;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
    this.totalCount = totalCount;
    this.communityStats = communityStats || {
      totalMembers: 0,
      activeMembersToday: 0,
      postsToday: 0,
      engagementRate: 0
    };
  }
}

export class CommunityEngagementStatsDto {
  period: 'today' | 'week' | 'month';
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  activeMembers: number;
  engagementRate: number;
  topHashtags: string[];
  memberActivity: {
    date: string;
    posts: number;
    likes: number;
    comments: number;
    newMembers: number;
  }[];

  constructor(data: any) {
    this.period = data.period || 'today';
    this.totalPosts = data.totalPosts || 0;
    this.totalLikes = data.totalLikes || 0;
    this.totalComments = data.totalComments || 0;
    this.totalShares = data.totalShares || 0;
    this.activeMembers = data.activeMembers || 0;
    this.engagementRate = data.engagementRate || 0;
    this.topHashtags = data.topHashtags || [];
    this.memberActivity = data.memberActivity || [];
  }
}