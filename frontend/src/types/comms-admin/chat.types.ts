import {
    CommunityMessage,
    CommunityGroupMessage,
    ChannelMessagesResponse,
    GroupMessagesResponse
} from "@/types/community/chat.types";

export type {
    CommunityMessage,
    CommunityGroupMessage,
    ChannelMessagesResponse,
    GroupMessagesResponse
};

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
