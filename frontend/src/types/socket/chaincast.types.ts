export interface ChainCastParticipant {
    userId: string;
    username: string;
    userType: 'user' | 'communityAdmin';
    hasVideo?: boolean;
    hasAudio?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
}

export interface ChainCastReaction {
    userId: string;
    username: string;
    emoji: string;
    timestamp: Date;
}

export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
}
