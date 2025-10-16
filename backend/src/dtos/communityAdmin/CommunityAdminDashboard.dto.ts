import { BaseResponseDto } from '../base/BaseResponse.dto';

export interface CommunityOverviewDto {
    _id: string;
    name: string;
    username: string;
    description: string;
    category: string;
    logo: string;
    banner: string;
    memberCount: number;
    activeMembers: number;
    isVerified: boolean;
    settings: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    socialLinks: Array<{
        platform: string;
        url: string;
    }>;
}

export interface CommunityStatsDto {
    totalMembers: number;
    activeMembers: number;
    newMembersToday: number;
    newMembersThisWeek: number;
    totalPosts: number;
    postsToday: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
    growthRate: number;
}

export interface RecentActivityDto {
    id: string;
    type: 'join' | 'post' | 'like' | 'comment' | 'quest_complete' | 'upgrade';
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
    role: 'member' | 'moderator' | 'admin';
    isPremium: boolean;
}

export class CommunityAdminDashboardResponseDto extends BaseResponseDto {
    communityOverview: CommunityOverviewDto;
    stats: CommunityStatsDto;
    recentActivity: RecentActivityDto[];
    topMembers: TopMemberDto[];

    constructor(
        communityOverview: CommunityOverviewDto,
        stats: CommunityStatsDto,
        recentActivity: RecentActivityDto[],
        topMembers: TopMemberDto[],
        message: string = 'Dashboard data retrieved successfully'
    ) {
        super(true, message);
        this.communityOverview = communityOverview;
        this.stats = stats;
        this.recentActivity = recentActivity;
        this.topMembers = topMembers;
    }
}
