export interface ChainCast {
    _id: string;
    communityId: string;
    admin: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    title: string;
    description?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduledStartTime?: Date;
    actualStartTime?: Date;
    endTime?: Date;
    maxParticipants: number;
    currentParticipants: number;
    settings: {
        allowReactions: boolean;
        allowChat: boolean;
        moderationRequired: boolean;
        recordSession: boolean;
    };
    stats: {
        totalViews: number;
        peakViewers: number;
        totalReactions: number;
        averageWatchTime: number;
    };
    canJoin: boolean;
    canModerate: boolean;
    isParticipant: boolean;
    userRole?: 'viewer' | 'moderator' | 'admin';
    streamUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChainCastParticipant {
    _id: string;
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
        isVerified: boolean;
    };
    role: 'viewer' | 'moderator' | 'admin';
    joinedAt: Date;
    isActive: boolean;
    permissions: {
        canStream: boolean;
        canModerate: boolean;
        canReact: boolean;
        canChat: boolean;
    };
    streamData: {
        hasVideo: boolean;
        hasAudio: boolean;
        isMuted: boolean;
        isVideoOff: boolean;
    };
    watchTime: number;
    reactionsCount: number;
}

export interface ChainCastModerationRequest {
    _id: string;
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
    };
    requestedPermissions: {
        video: boolean;
        audio: boolean;
    };
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewMessage?: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface ChainCastReaction {
    _id: string;
    user: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
    };
    emoji: string;
    timestamp: Date;
}

export interface CreateChainCastRequest {
    title: string;
    description?: string;
    scheduledStartTime?: string;
    maxParticipants?: number;
    settings?: {
        allowReactions?: boolean;
        allowChat?: boolean;
        moderationRequired?: boolean;
        recordSession?: boolean;
    };
}

export interface UpdateChainCastRequest {
    title?: string;
    description?: string;
    scheduledStartTime?: string;
    maxParticipants?: number;
    settings?: {
        allowReactions?: boolean;
        allowChat?: boolean;
        moderationRequired?: boolean;
        recordSession?: boolean;
    };
}

export interface ChainCastsResponse {
    chainCasts: ChainCast[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    summary?: {
        live: number;
        scheduled: number;
        ended: number;
    };
}

export interface ParticipantsResponse {
    participants: ChainCastParticipant[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    activeCount: number;
    moderatorCount: number;
}

export interface ModerationRequestsResponse {
    requests: ChainCastModerationRequest[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    pendingCount: number;
}

export interface ReactionsResponse {
    reactions: ChainCastReaction[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    reactionsSummary: { [emoji: string]: number };
}
