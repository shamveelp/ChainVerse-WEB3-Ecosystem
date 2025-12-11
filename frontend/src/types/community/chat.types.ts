export interface CommunityMessage {
    _id: string;
    communityId: string;
    admin: {
        _id: string;
        name: string;
        profilePicture: string;
    };
    content: string;
    mediaFiles: {
        type: 'image' | 'video';
        url: string;
        filename: string;
    }[];
    messageType: 'text' | 'media' | 'mixed';
    isPinned: boolean;
    reactions: {
        emoji: string;
        count: number;
        userReacted: boolean;
    }[];
    totalReactions: number;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommunityGroupMessage {
    _id: string;
    communityId: string;
    sender: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
    };
    content: string;
    isEdited: boolean;
    editedAt?: Date;
    isCurrentUser: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChannelMessagesResponse {
    messages: CommunityMessage[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface GroupMessagesResponse {
    messages: CommunityGroupMessage[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}
