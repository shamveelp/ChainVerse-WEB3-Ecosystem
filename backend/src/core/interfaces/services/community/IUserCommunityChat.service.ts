import {
    CommunityMessagesListResponseDto
} from "../../../../dtos/communityChat/CommunityMessage.dto";
import {
    SendGroupMessageDto,
    CommunityGroupMessageResponseDto,
    CommunityGroupMessagesListResponseDto
} from "../../../../dtos/communityChat/CommunityGroupMessage.dto";

export interface IUserCommunityChatService {
    // Community Channel
    getChannelMessages(userId: string, communityUsername: string, cursor?: string, limit?: number): Promise<CommunityMessagesListResponseDto>;
    reactToMessage(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: Record<string, unknown>[] }>;
    removeReaction(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: Record<string, unknown>[] }>;

    // Community Group Chat
    sendGroupMessage(userId: string, data: SendGroupMessageDto): Promise<CommunityGroupMessageResponseDto>;
    getGroupMessages(userId: string, communityUsername: string, cursor?: string, limit?: number): Promise<CommunityGroupMessagesListResponseDto>;
    editGroupMessage(userId: string, messageId: string, content: string): Promise<CommunityGroupMessageResponseDto>;
    deleteGroupMessage(userId: string, messageId: string): Promise<{ success: boolean; message: string }>;
    markGroupMessagesAsRead(userId: string, communityUsername: string): Promise<{ success: boolean; message: string }>;
}
