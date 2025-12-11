export interface PostAuthor {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    isCommunityMember: boolean;
}

export interface CommunityPost {
    _id: string;
    author: PostAuthor;
    content: string;
    mediaUrls: string[];
    mediaType: 'none' | 'image' | 'video';
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isOwnPost: boolean;
    canModerate: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
}

export interface CommunityFeedResponse {
    posts: CommunityPost[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    communityStats: {
        totalMembers: number;
        activeMembersToday: number;
        postsToday: number;
        engagementRate: number;
    };
}

export interface CreateCommentData {
    postId: string;
    content: string;
    parentCommentId?: string;
}

export interface SharePostData {
    shareText?: string;
}

export interface LikeResponse {
    success: boolean;
    isLiked: boolean;
    likesCount: number;
    message: string;
}

export interface ShareResponse {
    success: boolean;
    shareUrl: string;
    sharesCount: number;
    message: string;
}

export interface EngagementStats {
    period: 'today' | 'week' | 'month';
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    activeMembers: number;
    engagementRate: number;
    topHashtags: string[];
    memberActivity: Array<{
        date: string;
        posts: number;
        likes: number;
        comments: number;
        newMembers: number;
    }>;
}
