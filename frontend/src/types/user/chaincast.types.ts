export interface JoinChainCastRequest {
    chainCastId: string;
    quality?: 'low' | 'medium' | 'high';
}

export interface UpdateParticipantRequest {
    hasVideo?: boolean;
    hasAudio?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
}

export interface RequestModerationRequest {
    chainCastId: string;
    requestedPermissions: {
        video: boolean;
        audio: boolean;
    };
    message?: string;
}

export interface AddReactionRequest {
    chainCastId: string;
    emoji: string;
}

export interface JoinChainCastResponse {
    success: boolean;
    message: string;
    streamUrl?: string;
}

export interface CanJoinResponse {
    canJoin: boolean;
    reason?: string;
}
