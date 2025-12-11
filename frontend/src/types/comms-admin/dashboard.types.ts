export interface CommunityOverview {
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

export interface CommunityStats {
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

export interface RecentActivity {
    id: string;
    type: string;
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    action: string;
    timestamp: Date;
}

export interface TopMember {
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

export interface DashboardData {
    communityOverview: CommunityOverview;
    stats: CommunityStats;
    recentActivity: RecentActivity[];
    topMembers: TopMember[];
}
