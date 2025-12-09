import {
    CommunityMessagesListResponseDto,
    CommunityMessageResponseDto
} from "../../../../dtos/communityChat/CommunityMessage.dto";
import {
    SendGroupMessageDto,
    EditGroupMessageDto,
    CommunityGroupMessageResponseDto,
    CommunityGroupMessagesListResponseDto
} from "../../../../dtos/communityChat/CommunityGroupMessage.dto";

export interface IUserCommunityChatService {
    // Community Channel
    getChannelMessages(userId: string, communityUsername: string, cursor?: string, limit?: number): Promise<CommunityMessagesListResponseDto>;
    reactToMessage(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: any[] }>;
    removeReaction(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: any[] }>;

    // Community Group Chat
    sendGroupMessage(userId: string, data: SendGroupMessageDto): Promise<CommunityGroupMessageResponseDto>;
    getGroupMessages(userId: string, communityUsername: string, cursor?: string, limit?: number): Promise<CommunityGroupMessagesListResponseDto>;
    editGroupMessage(userId: string, messageId: string, content: string): Promise<CommunityGroupMessageResponseDto>;
    deleteGroupMessage(userId: string, messageId: string): Promise<{ success: boolean; message: string }>;
    markGroupMessagesAsRead(userId: string, communityUsername: string): Promise<{ success: boolean; message: string }>;
}
