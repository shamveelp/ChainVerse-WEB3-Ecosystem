export interface MyCommunity {
    _id: string;
    communityName: string;
    username: string;
    description: string;
    category: string;
    logo: string;
    banner?: string;
    isVerified: boolean;
    memberCount: number;
    memberRole: string;
    joinedAt: Date;
    lastActiveAt?: Date;
    unreadPosts: number;
    totalPosts: number;
    isActive: boolean;
    settings: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    notifications: boolean;
    createdAt: Date;
}

export interface MyCommunitiesStats {
    totalCommunities: number;
    adminCommunities: number;
    moderatorCommunities: number;
    memberCommunities: number;
    // Add other stats as needed
}

export interface CommunityActivity {
    communityId: string;
    communityName: string;
    username: string;
    logo: string;
    lastActiveAt: Date;
    unreadPosts: number;
    recentActivity: string;
}

export interface MyCommunitiesResponse {
    communities: MyCommunity[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    stats: MyCommunitiesStats;
}

export interface MyCommunitiesActivityResponse {
    activities: CommunityActivity[];
    totalUnreadPosts: number;
    mostActiveToday: string[];
}
