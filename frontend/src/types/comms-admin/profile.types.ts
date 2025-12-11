export interface CommunityStats {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    totalQuests: number;
    premiumMembers: number;
    engagementRate: number;
    myPostsCount: number;
    myLikesCount: number;
    myCommentsCount: number;
}

export interface CommunityAdminProfile {
    _id: string;
    name: string;
    email: string;
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    profilePic?: string;
    bannerImage?: string;
    communityId?: string;
    communityName?: string;
    communityLogo?: string;
    isActive: boolean;
    lastLogin?: Date;
    joinDate: Date;
    stats: CommunityStats;
}

export interface UpdateProfileData {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
}
