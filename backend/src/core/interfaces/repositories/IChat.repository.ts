import { IConversation, IMessage } from "../../../models/chat.models";
import { ConversationListResponseDto, MessageListResponseDto } from "../../../dtos/chat/Chat.dto";

export interface IChatRepository {
  // Conversation methods
  findConversationByParticipants(participant1: string, participant2: string): Promise<IConversation | null>;
  createConversation(participants: string[]): Promise<IConversation>;
  updateConversationLastActivity(conversationId: string, lastMessageId?: string): Promise<void>;
  getUserConversations(userId: string, cursor?: string, limit?: number, search?: string): Promise<ConversationListResponseDto>;

  // Message methods
  createMessage(conversationId: string, senderId: string, content: string): Promise<IMessage>;
  getConversationMessages(conversationId: string, userId: string, cursor?: string, limit?: number): Promise<MessageListResponseDto>;
  editMessage(messageId: string, content: string): Promise<IMessage | null>;
  deleteMessage(messageId: string): Promise<boolean>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;

  // Utility methods
  checkUserInConversation(conversationId: string, userId: string): Promise<boolean>;
  findMessageById(messageId: string): Promise<IMessage | null>;
  getConversationById(conversationId: string): Promise<IConversation | null>;
}