import { injectable, inject } from "inversify";
import { IChatService } from "../../core/interfaces/services/chat/IChat.service";
import { IChatRepository } from "../../core/interfaces/repositories/IChat.repository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import {
  SendMessageResponseDto,
  ConversationListResponseDto,
  MessageListResponseDto,
  MessageResponseDto,
  ConversationResponseDto,
  ParticipantDto,
} from "../../dtos/chat/Chat.dto";
import { Types } from "mongoose";
import logger from "../../utils/logger";

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository,
    @inject(TYPES.ICommunityRepository)
    private _communityRepository: ICommunityRepository
  ) { }

  /**
   * Sends a message to a user.
   * @param {string} senderId - Sender ID.
   * @param {string} receiverUsername - Receiver username.
   * @param {string} content - Message content.
   * @returns {Promise<SendMessageResponseDto>} Message response.
   */
  async sendMessage(
    senderId: string,
    receiverUsername: string,
    content: string
  ): Promise<SendMessageResponseDto> {
    try {
      if (!senderId || !receiverUsername || !content?.trim()) {
        throw new CustomError(
          ErrorMessages.CONTENT_RECEIVER_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      // Find receiver by username
      const receiver = await this._communityRepository.findUserByUsername(
        receiverUsername.trim()
      );
      if (!receiver) {
        throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Safely get receiver ID
      const receiverId = receiver._id
        ? receiver._id.toString()
        : receiver.id?.toString();
      if (!receiverId) {
        throw new CustomError(
          ErrorMessages.USER_PROFILE_NOT_FOUND,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Check if sender is trying to message themselves
      if (senderId === receiverId) {
        throw new CustomError(
          ErrorMessages.SELF_MESSAGE_ERROR,
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
        conversation._id.toString(),
        senderId,
        content.trim()
      );

      // Transform message response
      const populatedMessage = message as unknown as {
        _id: Types.ObjectId;
        conversationId: Types.ObjectId;
        sender: { _id: Types.ObjectId; username: string; name?: string; profilePic?: string; community?: { isVerified: boolean } };
        content: string;
        messageType: 'text';
        readBy: Array<{ user: Types.ObjectId; readAt: Date }>;
        editedAt?: Date;
        isDeleted: boolean;
        createdAt: Date;
        updatedAt: Date;
      };

      const messageResponse: MessageResponseDto = {
        _id: populatedMessage._id.toString(),
        conversationId: populatedMessage.conversationId.toString(),
        sender: {
          _id: populatedMessage.sender._id.toString(),
          username: populatedMessage.sender.username || "",
          name: populatedMessage.sender.name || populatedMessage.sender.username || "",
          profilePic: populatedMessage.sender.profilePic || "",
          isVerified: populatedMessage.sender.community?.isVerified || false,
        },
        content: populatedMessage.content,
        messageType: populatedMessage.messageType,
        readBy: populatedMessage.readBy.map((r) => ({
          user: r.user.toString(),
          readAt: r.readAt,
        })),
        editedAt: populatedMessage.editedAt,
        isDeleted: populatedMessage.isDeleted,
        createdAt: populatedMessage.createdAt,
        updatedAt: populatedMessage.updatedAt,
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

      const conversationId = conversation._id.toString();
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
      logger.error(LoggerMessages.SEND_MESSAGE_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_SEND_MESSAGE,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves user conversations.
   * @param {string} userId - User ID.
   * @param {string} [cursor] - Cursor for pagination.
   * @param {number} [limit=20] - Limit.
   * @param {string} [search] - Search query.
   * @returns {Promise<ConversationListResponseDto>} List of conversations.
   */
  async getUserConversations(
    userId: string,
    cursor?: string,
    limit: number = 20,
    search?: string
  ): Promise<ConversationListResponseDto> {
    try {
      if (!userId) {
        throw new CustomError(ErrorMessages.USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
      }

      return await this._chatRepository.getUserConversations(
        userId,
        cursor,
        limit,
        search
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_USER_CONVERSATIONS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_CONVERSATIONS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves messages for a conversation.
   * @param {string} conversationId - Conversation ID.
   * @param {string} userId - User ID.
   * @param {string} [cursor] - Cursor.
   * @param {number} [limit=20] - Limit.
   * @returns {Promise<MessageListResponseDto>} List of messages.
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<MessageListResponseDto> {
    try {
      if (!conversationId || !userId) {
        throw new CustomError(
          ErrorMessages.CONVERSATION_USER_ID_REQUIRED,
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
          ErrorMessages.CONVERSATION_ACCESS_DENIED,
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
      logger.error(LoggerMessages.GET_CONVERSATION_MESSAGES_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_MESSAGES,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Edits a message.
   * @param {string} messageId - Message ID.
   * @param {string} userId - User ID.
   * @param {string} content - New content.
   * @returns {Promise<MessageResponseDto>} Edited message.
   */
  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<MessageResponseDto> {
    try {
      if (!messageId || !userId || !content?.trim()) {
        throw new CustomError(
          ErrorMessages.MESSAGE_ID_CONTENT_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      // Find the message
      const message = await this._chatRepository.findMessageById(messageId);
      if (!message) {
        throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Check if user is the sender - safely get sender ID
      const senderId = (message.sender as unknown as { _id: Types.ObjectId })._id.toString();
      if (senderId !== userId) {
        throw new CustomError(
          ErrorMessages.EDIT_OTHERS_MESSAGE_ERROR,
          StatusCode.FORBIDDEN
        );
      }

      // Check if message is not too old (24 hours limit)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours
      if (messageAge > maxEditTime) {
        throw new CustomError(
          ErrorMessages.MESSAGE_TOO_OLD,
          StatusCode.BAD_REQUEST
        );
      }

      const editedMessage = await this._chatRepository.editMessage(
        messageId,
        content.trim()
      );
      if (!editedMessage) {
        throw new CustomError(
          ErrorMessages.FAILED_EDIT_MESSAGE,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      const populatedEditedMessage = editedMessage as unknown as {
        _id: Types.ObjectId;
        conversationId: Types.ObjectId;
        sender: { _id: Types.ObjectId; username: string; name?: string; profilePic?: string; community?: { isVerified: boolean } };
        content: string;
        messageType: 'text';
        readBy: Array<{ user: Types.ObjectId; readAt: Date }>;
        editedAt?: Date;
        isDeleted: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        _id: populatedEditedMessage._id.toString(),
        conversationId: populatedEditedMessage.conversationId.toString(),
        sender: {
          _id: populatedEditedMessage.sender._id.toString(),
          username: populatedEditedMessage.sender.username || "",
          name: populatedEditedMessage.sender.name || populatedEditedMessage.sender.username || "",
          profilePic: populatedEditedMessage.sender.profilePic || "",
          isVerified: populatedEditedMessage.sender.community?.isVerified || false,
        },
        content: populatedEditedMessage.content,
        messageType: populatedEditedMessage.messageType,
        readBy: populatedEditedMessage.readBy.map((r) => ({
          user: r.user.toString(),
          readAt: r.readAt,
        })),
        editedAt: populatedEditedMessage.editedAt,
        isDeleted: populatedEditedMessage.isDeleted,
        createdAt: populatedEditedMessage.createdAt,
        updatedAt: populatedEditedMessage.updatedAt,
        isOwnMessage: true,
      };
    } catch (error) {
      logger.error(LoggerMessages.EDIT_MESSAGE_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_EDIT_MESSAGE,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Deletes a message.
   * @param {string} messageId - Message ID.
   * @param {string} userId - User ID.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!messageId || !userId) {
        throw new CustomError(
          ErrorMessages.MESSAGE_ID_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      // Find the message
      const message = await this._chatRepository.findMessageById(messageId);
      if (!message) {
        throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Check if user is the sender - safely get sender ID
      const senderId = (message.sender as unknown as { _id: Types.ObjectId })._id.toString();
      if (senderId !== userId) {
        throw new CustomError(
          ErrorMessages.DELETE_OTHERS_MESSAGE_ERROR,
          StatusCode.FORBIDDEN
        );
      }

      const deleted = await this._chatRepository.deleteMessage(messageId);
      if (!deleted) {
        throw new CustomError(
          ErrorMessages.FAILED_DELETE_MESSAGE,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: SuccessMessages.MESSAGE_DELETED_SUCCESS,
      };
    } catch (error) {
      logger.error(LoggerMessages.DELETE_MESSAGE_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_DELETE_MESSAGE,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Marks messages as read in a conversation.
   * @param {string} conversationId - Conversation ID.
   * @param {string} userId - User ID.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!conversationId || !userId) {
        throw new CustomError(
          ErrorMessages.CONVERSATION_USER_ID_REQUIRED,
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
          ErrorMessages.CONVERSATION_ACCESS_DENIED,
          StatusCode.FORBIDDEN
        );
      }

      await this._chatRepository.markMessagesAsRead(conversationId, userId);

      return {
        success: true,
        message: SuccessMessages.MESSAGES_READ_SUCCESS,
      };
    } catch (error) {
      logger.error(LoggerMessages.MARK_MESSAGES_READ_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_MARK_READ,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves or creates a conversation between two users.
   * @param {string} userId - User ID.
   * @param {string} otherUsername - Other user's username.
   * @returns {Promise<ConversationResponseDto>} Conversation details.
   */
  async getOrCreateConversation(
    userId: string,
    otherUsername: string
  ): Promise<ConversationResponseDto> {
    try {
      if (!userId || !otherUsername) {
        throw new CustomError(
          ErrorMessages.CONTENT_RECEIVER_REQUIRED, // Reusing existing or need specific
          StatusCode.BAD_REQUEST
        );
      }

      // Find other user
      const otherUser = await this._communityRepository.findUserByUsername(
        otherUsername.trim()
      );

      if (!otherUser) {
        throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      logger.info("ChatService: Found user:", {
        id: otherUser._id,
        username: otherUser.username,
        hasId: !!otherUser._id,
      });

      // Safely get the other user's ID
      const otherUserId = otherUser._id
        ? otherUser._id.toString()
        : (otherUser as unknown as { id?: { toString(): string } }).id?.toString();

      if (!otherUserId) {
        throw new CustomError(
          ErrorMessages.USER_PROFILE_NOT_FOUND,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Check if trying to create conversation with self
      if (userId === otherUserId) {
        throw new CustomError(
          ErrorMessages.SELF_CONVERSATION_ERROR,
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
        : (conversation as unknown as { id: { toString(): string } }).id.toString();
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
          ? (() => {
            const lastMsg = conversation.lastMessage as unknown as {
              _id: Types.ObjectId;
              sender: { _id: Types.ObjectId; username?: string; name?: string; profilePic?: string; community?: { isVerified: boolean } };
              content: string;
              messageType: 'text';
              readBy: Array<{ user: Types.ObjectId; readAt: Date }>;
              editedAt?: Date;
              isDeleted: boolean;
              createdAt: Date;
              updatedAt: Date;
            };
            return {
              _id: lastMsg._id.toString(),
              conversationId: conversationId,
              sender: {
                _id: lastMsg.sender._id.toString(),
                username: lastMsg.sender.username || "",
                name: lastMsg.sender.name || "",
                profilePic: lastMsg.sender.profilePic || "",
                isVerified: lastMsg.sender.community?.isVerified || false,
              },
              content: lastMsg.content,
              messageType: lastMsg.messageType,
              readBy: lastMsg.readBy.map((r) => ({
                user: r.user.toString(),
                readAt: r.readAt,
              })),
              editedAt: lastMsg.editedAt,
              isDeleted: lastMsg.isDeleted,
              createdAt: lastMsg.createdAt,
              updatedAt: lastMsg.updatedAt,
              isOwnMessage: lastMsg.sender._id.toString() === userId,
            } as MessageResponseDto;
          })()
          : undefined,
        lastActivity: conversation.lastActivity,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      return response;
    } catch (error) {
      logger.error(LoggerMessages.GET_CREATE_CONVERSATION_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_CREATE_CONVERSATION,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
