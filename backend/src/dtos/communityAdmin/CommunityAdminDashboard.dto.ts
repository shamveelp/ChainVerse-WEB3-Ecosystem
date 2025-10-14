import { BaseResponseDto } from '../base/BaseResponse.dto';

export interface DashboardStatsDto {
    totalMembers: number;
    activeMembers: number;
    premiumMembers: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    questsCreated: number;
    questsCompleted: number;
    engagementRate: number;
    growthRate: number;
}

export interface RecentActivityDto {
    id: string;
    type: 'join' | 'post' | 'quest_complete' | 'upgrade' | 'like' | 'comment';
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    action: string;
    timestamp: Date;
    metadata?: any;
}

export interface TopMemberDto {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
    joinedAt: Date;
    role: string;
    isPremium: boolean;
}

export interface CommunityHealthDto {
    engagementRate: number;
    questCompletionRate: number;
    memberSatisfaction: number;
    averageSessionTime: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
}

export class DashboardResponseDto extends BaseResponseDto {
    stats: DashboardStatsDto;
    recentActivity: RecentActivityDto[];
    topMembers: TopMemberDto[];
    communityHealth: CommunityHealthDto;

    constructor(
        stats: DashboardStatsDto,
        recentActivity: RecentActivityDto[],
        topMembers: TopMemberDto[],
        communityHealth: CommunityHealthDto,
        message: string = 'Dashboard data retrieved successfully'
    ) {
        super(true, message);
        this.stats = stats;
        this.recentActivity = recentActivity;
        this.topMembers = topMembers;
        this.communityHealth = communityHealth;
    }
}