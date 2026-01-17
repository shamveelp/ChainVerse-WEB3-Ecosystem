export interface ExploreCommunity {
    _id: string;
    communityName: string;
    username: string;
    description: string;
    category: string;
    logo: string;
    banner?: string;
    isVerified: boolean;
    memberCount: number;
    isMember: boolean;
    createdAt: Date | string;
    rules?: string[];
    socialLinks?: SocialLink[];
    settings?: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    memberRole?: string;
    isAdmin?: boolean;
}

export interface ExploreCommunityProfile extends ExploreCommunity {
    banner: string;
    rules: string[];
    socialLinks: SocialLink[];
    settings: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    memberRole?: string;
    isAdmin: boolean;
}

export interface CommunityMember {
    _id: string;
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    role: string;
    joinedAt: Date;
    isActive: boolean;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
}

export interface UserSearchResult {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    bio: string;
    isVerified: boolean;
    followersCount: number;
    isFollowing?: boolean;
}

export interface ExploreUserProfile {
    _id: string;
    username: string;
    name: string;
    email: string;
    profilePic: string;
    followersCount: number;
    followingCount: number;
    bio: string;
    location: string;
    website: string;
    bannerImage: string;
    isVerified: boolean;
    postsCount: number;
    likesReceived: number;
    socialLinks: {
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        github?: string;
    };
    settings: {
        isProfilePublic: boolean;
        allowDirectMessages: boolean;
        showFollowersCount: boolean;
        showFollowingCount: boolean;
    };
    joinDate: Date;
    isOwnProfile: boolean;
    isFollowing?: boolean;
}

export interface SearchResponse {
    communities: ExploreCommunity[];
    users: UserSearchResult[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    searchType: string;
}

export interface CommunityListResponse {
    communities: ExploreCommunity[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface CommunityMemberListResponse {
    members: CommunityMember[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface JoinCommunityResponse {
    success: boolean;
    message: string;
    isMember: boolean;
    memberCount: number;
    joinedAt?: Date;
    leftAt?: Date;
}

export interface FollowResponse {
    success: boolean;
    message: string;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
}

export interface SocialLink {
    platform: string;
    url: string;
}
