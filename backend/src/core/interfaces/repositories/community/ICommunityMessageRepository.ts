import { ICommunityMessage } from "../../../../models/communityMessage.model";
import { ICommunityGroupMessage } from "../../../../models/communityGroupMessage.model";

export interface ICommunityMessageRepository {
    // Community Channel Messages
    createMessage(messageData: Partial<ICommunityMessage>): Promise<ICommunityMessage>;
    getMessages(communityId: string, cursor?: string, limit?: number): Promise<{
        messages: ICommunityMessage[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;
    getMessageById(messageId: string): Promise<ICommunityMessage | null>;
    updateMessage(messageId: string, updateData: Partial<ICommunityMessage>): Promise<ICommunityMessage | null>;
    deleteMessage(messageId: string): Promise<boolean>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<ICommunityMessage | null>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<ICommunityMessage | null>;

    // Community Group Messages
    createGroupMessage(messageData: Partial<ICommunityGroupMessage>): Promise<ICommunityGroupMessage>;
    getGroupMessages(communityId: string, cursor?: string, limit?: number): Promise<{
        messages: ICommunityGroupMessage[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;
    getGroupMessageById(messageId: string): Promise<ICommunityGroupMessage | null>;
    updateGroupMessage(messageId: string, updateData: Partial<ICommunityGroupMessage>): Promise<ICommunityGroupMessage | null>;
    deleteGroupMessage(messageId: string, userId: string): Promise<boolean>;
    markMessagesAsRead(communityId: string, userId: string): Promise<boolean>;
}
