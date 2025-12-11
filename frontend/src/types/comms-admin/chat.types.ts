import { CommunityMessage, CommunityGroupMessage } from "@/types/community/chat.types";

export type { CommunityMessage, CommunityGroupMessage };

export interface CreateChannelMessageRequest {
    content: string;
    mediaFiles?: {
        type: 'image' | 'video';
        url: string;
        publicId: string;
        filename: string;
    }[];
    messageType?: 'text' | 'media' | 'mixed';
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
