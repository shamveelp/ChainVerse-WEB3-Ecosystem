import {
  SendMessageResponseDto,
  ConversationListResponseDto,
  MessageListResponseDto,
  MessageResponseDto,
  ConversationResponseDto
} from "../../../../dtos/chat/Chat.dto";

export interface IChatService {
  sendMessage(senderId: string, receiverUsername: string, content: string): Promise<SendMessageResponseDto>;
  getUserConversations(userId: string, cursor?: string, limit?: number, search?: string): Promise<ConversationListResponseDto>;
  getConversationMessages(conversationId: string, userId: string, cursor?: string, limit?: number): Promise<MessageListResponseDto>;
  editMessage(messageId: string, userId: string, content: string): Promise<MessageResponseDto>;
  deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; message: string }>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<{ success: boolean; message: string }>;
  getOrCreateConversation(userId: string, otherUsername: string): Promise<ConversationResponseDto>;
}