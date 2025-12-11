export interface SendChannelMessageData {
    content: string;
    mediaFiles?: any[];
    messageType?: "text" | "media" | "mixed";
}

export interface SendGroupMessageData {
    communityUsername: string | undefined;
    content: string;
}

export interface ReactionData {
    messageId: string;
    emoji: string;
}

export interface TypingData {
    communityId: string;
}
