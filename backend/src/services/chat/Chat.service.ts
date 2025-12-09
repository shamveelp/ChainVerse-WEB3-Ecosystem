import { injectable, inject } from "inversify";
import { IChatService } from "../../core/interfaces/services/chat/IChat.service";
import { IChatRepository } from "../../core/interfaces/repositories/IChatRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import {
  SendMessageResponseDto,
  ConversationListResponseDto,
  MessageListResponseDto,
  MessageResponseDto,
  ConversationResponseDto,
  ParticipantDto,
} from "../../dtos/chat/Chat.dto";
import logger from "../../utils/logger";

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository,
    @inject(TYPES.ICommunityRepository)
    private _communityRepository: ICommunityRepository
  ) {}

  async sendMessage(
    senderId: string,
    receiverUsername: string,
    content: string
  ): Promise<SendMessageResponseDto> {
    try {
      if (!senderId || !receiverUsername || !content?.trim()) {
        throw new CustomError(
          "Sender ID, receiver username, and content are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Find receiver by username
      const receiver = await this._communityRepository.findUserByUsername(
        receiverUsername.trim()
      );
      if (!receiver) {
        throw new CustomError("Receiver not found", StatusCode.NOT_FOUND);
      }

      // Safely get receiver ID
      const receiverId = receiver._id
        ? receiver._id.toString()
        : receiver.id?.toString();
      if (!receiverId) {
        throw new CustomError(
          "Invalid receiver user data",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Check if sender is trying to message themselves
      if (senderId === receiverId) {
        throw new CustomError(
          "You cannot send a message to yourself",
          StatusCode.BAD_REQUEST
        );
      }

      // Find or create conversation
      let conversation =
        await this._chatRepository.findConversationByParticipants(
          senderId,
          receiverId
        );

      if (!conversation) {
        conversation = await this._chatRepository.createConversation([
          senderId,
          receiverId,
        ]);
      }

      // Create message
      const message = await this._chatRepository.createMessage(
        conversation._id
          ? conversation._id.toString()
          : (conversation as any).id.toString(),
        senderId,
        content.trim()
      );

      // Transform message response
      const sender = message.sender as any;
      const messageResponse: MessageResponseDto = {
        _id: message._id
          ? message._id.toString()
          : (message as any).id.toString(),
        conversationId: message.conversationId.toString(),
        sender: {
          _id: sender._id ? sender._id.toString() : sender.id.toString(),
          username: sender.username || "",
          name: sender.name || sender.username || "",
          profilePic: sender.profilePic || "",
          isVerified: sender.community?.isVerified || false,
        },
        content: message.content,
        messageType: message.messageType,
        readBy: message.readBy.map((r) => ({
          user: r.user.toString(),
          readAt: r.readAt,
        })),
        editedAt: message.editedAt,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isOwnMessage: true,
      };

      // Transform conversation response
      const participants: ParticipantDto[] = [
        {
          _id: receiverId,
          username: receiver.username,
          name: receiver.name || receiver.username,
          profilePic: receiver.profilePic || "",
          isVerified: receiver.community?.isVerified || false,
        },
      ];

      const conversationId = conversation._id
        ? conversation._id.toString()
        : (conversation as any).id.toString();
      const conversationResponse: ConversationResponseDto = {
        _id: conversationId,
        participants,
        lastMessage: messageResponse,
        lastActivity: conversation.lastActivity,
        unreadCount: 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      return {
        success: true,
        message: messageResponse,
        conversation: conversationResponse,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to send message",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserConversations(
    userId: string,
    cursor?: string,
    limit: number = 20,
    search?: string
  ): Promise<ConversationListResponseDto> {
    try {
      if (!userId) {
        throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
      }

      return await this._chatRepository.getUserConversations(
        userId,
        cursor,
        limit,
        search
      );
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get conversations",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<MessageListResponseDto> {
    try {
      if (!conversationId || !userId) {
        throw new CustomError(
          "Conversation ID and user ID are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if user is part of the conversation
      const hasAccess = await this._chatRepository.checkUserInConversation(
        conversationId,
        userId
      );
      if (!hasAccess) {
        throw new CustomError(
          "You don't have access to this conversation",
          StatusCode.FORBIDDEN
        );
      }

      return await this._chatRepository.getConversationMessages(
        conversationId,
        userId,
        cursor,
        limit
      );
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get messages",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<MessageResponseDto> {
    try {
      if (!messageId || !userId || !content?.trim()) {
        throw new CustomError(
          "Message ID, user ID, and content are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Find the message
      const message = await this._chatRepository.findMessageById(messageId);
      if (!message) {
        throw new CustomError("Message not found", StatusCode.NOT_FOUND);
      }

      // Check if user is the sender - safely get sender ID
      const senderId = message.sender._id
        ? message.sender._id.toString()
        : (message.sender as any).id?.toString();
      if (senderId !== userId) {
        throw new CustomError(
          "You can only edit your own messages",
          StatusCode.FORBIDDEN
        );
      }

      // Check if message is not too old (24 hours limit)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours
      if (messageAge > maxEditTime) {
        throw new CustomError(
          "Message is too old to edit",
          StatusCode.BAD_REQUEST
        );
      }

      const editedMessage = await this._chatRepository.editMessage(
        messageId,
        content.trim()
      );
      if (!editedMessage) {
        throw new CustomError(
          "Failed to edit message",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Transform response
      const sender = editedMessage.sender as any;
      return {
        _id: editedMessage._id
          ? editedMessage._id.toString()
          : (editedMessage as any).id.toString(),
        conversationId: editedMessage.conversationId.toString(),
        sender: {
          _id: sender._id ? sender._id.toString() : sender.id.toString(),
          username: sender.username || "",
          name: sender.name || sender.username || "",
          profilePic: sender.profilePic || "",
          isVerified: sender.community?.isVerified || false,
        },
        content: editedMessage.content,
        messageType: editedMessage.messageType,
        readBy: editedMessage.readBy.map((r) => ({
          user: r.user.toString(),
          readAt: r.readAt,
        })),
        editedAt: editedMessage.editedAt,
        isDeleted: editedMessage.isDeleted,
        createdAt: editedMessage.createdAt,
        updatedAt: editedMessage.updatedAt,
        isOwnMessage: true,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to edit message",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!messageId || !userId) {
        throw new CustomError(
          "Message ID and user ID are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Find the message
      const message = await this._chatRepository.findMessageById(messageId);
      if (!message) {
        throw new CustomError("Message not found", StatusCode.NOT_FOUND);
      }

      // Check if user is the sender - safely get sender ID
      const senderId = message.sender._id
        ? message.sender._id.toString()
        : (message.sender as any).id?.toString();
      if (senderId !== userId) {
        throw new CustomError(
          "You can only delete your own messages",
          StatusCode.FORBIDDEN
        );
      }

      const deleted = await this._chatRepository.deleteMessage(messageId);
      if (!deleted) {
        throw new CustomError(
          "Failed to delete message",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: "Message deleted successfully",
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to delete message",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!conversationId || !userId) {
        throw new CustomError(
          "Conversation ID and user ID are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if user is part of the conversation
      const hasAccess = await this._chatRepository.checkUserInConversation(
        conversationId,
        userId
      );
      if (!hasAccess) {
        throw new CustomError(
          "You don't have access to this conversation",
          StatusCode.FORBIDDEN
        );
      }

      await this._chatRepository.markMessagesAsRead(conversationId, userId);

      return {
        success: true,
        message: "Messages marked as read",
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to mark messages as read",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getOrCreateConversation(
    userId: string,
    otherUsername: string
  ): Promise<ConversationResponseDto> {
    try {
      if (!userId || !otherUsername) {
        throw new CustomError(
          "User ID and other username are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Find other user
      const otherUser = await this._communityRepository.findUserByUsername(
        otherUsername.trim()
      );

      if (!otherUser) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      logger.info("ChatService: Found user:", {
        id: otherUser._id,
        username: otherUser.username,
        hasId: !!otherUser._id,
      });

      // Safely get the other user's ID
      const otherUserId = otherUser._id
        ? otherUser._id.toString()
        : (otherUser as any).id?.toString();

      if (!otherUserId) {
        throw new CustomError(
          "Invalid user data - missing ID",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Check if trying to create conversation with self
      if (userId === otherUserId) {
        throw new CustomError(
          "You cannot create a conversation with yourself",
          StatusCode.BAD_REQUEST
        );
      }

      // Find existing conversation

      let conversation =
        await this._chatRepository.findConversationByParticipants(
          userId,
          otherUserId
        );

      if (!conversation) {
        // Create new conversation

        conversation = await this._chatRepository.createConversation([
          userId,
          otherUserId,
        ]);
      }

      // Get unread count
      const conversationId = conversation._id
        ? conversation._id.toString()
        : (conversation as any).id.toString();
      const unreadCount = await this._chatRepository.getUnreadCount(
        conversationId,
        userId
      );

      const response: ConversationResponseDto = {
        _id: conversationId,
        participants: [
          {
            _id: otherUserId,
            username: otherUser.username,
            name: otherUser.name || otherUser.username,
            profilePic: otherUser.profilePic || "",
            isVerified: otherUser.community?.isVerified || false,
          },
        ],
        lastMessage: conversation.lastMessage
          ? {
              _id: (conversation.lastMessage as any)._id.toString(),
              conversationId: conversationId,
              sender: {
                _id: (conversation.lastMessage as any).sender._id.toString(),
                username:
                  (conversation.lastMessage as any).sender.username || "",
                name: (conversation.lastMessage as any).sender.name || "",
                profilePic:
                  (conversation.lastMessage as any).sender.profilePic || "",
                isVerified:
                  (conversation.lastMessage as any).sender.community
                    ?.isVerified || false,
              },
              content: (conversation.lastMessage as any).content,
              messageType: (conversation.lastMessage as any).messageType,
              readBy: (conversation.lastMessage as any).readBy || [],
              editedAt: (conversation.lastMessage as any).editedAt,
              isDeleted: (conversation.lastMessage as any).isDeleted,
              createdAt: (conversation.lastMessage as any).createdAt,
              updatedAt: (conversation.lastMessage as any).updatedAt,
              isOwnMessage:
                (conversation.lastMessage as any).sender._id.toString() ===
                userId,
            }
          : undefined,
        lastActivity: conversation.lastActivity,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      return response;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get or create conversation",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
