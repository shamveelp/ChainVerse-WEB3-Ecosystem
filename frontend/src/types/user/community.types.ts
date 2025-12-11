export interface CommunityProfile {
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
    joinDate: Date | string;
    isOwnProfile: boolean;
    isFollowing?: boolean;
}

export interface UserFollowInfo {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    bio: string;
    isFollowing: boolean;
    followedAt?: Date;
}

export interface FollowListResponse {
    users: UserFollowInfo[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface FollowResponse {
    success: boolean;
    message: string;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;

}

export interface UpdateCommunityProfileData {
    bio?: string;
    location?: string;
    website?: string;
    bannerImage?: string;
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        github?: string;
    };
    settings?: {
        isProfilePublic?: boolean;
        allowDirectMessages?: boolean;
        showFollowersCount?: boolean;
        showFollowingCount?: boolean;
    };
}

// Chat interfaces
export interface MessageResponse {
    _id: string;
    conversationId: string;
    sender: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    content: string;
    messageType: 'text';
    readBy: Array<{
        user: string;
        readAt: Date;
    }>;
    editedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    isOwnMessage: boolean;
}

export interface ConversationResponse {
    _id: string;
    participants: Array<{
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
        isOnline?: boolean;
        lastSeen?: Date;
    }>;
    lastMessage?: MessageResponse;
    lastActivity: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationListResponse {
    conversations: ConversationResponse[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface MessageListResponse {
    messages: MessageResponse[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface SendMessageResponse {
    success: boolean;
    message: MessageResponse;
    conversation: ConversationResponse;
}
