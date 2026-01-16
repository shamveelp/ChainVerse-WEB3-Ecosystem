import { injectable } from "inversify";
import { IChatRepository } from "../core/interfaces/repositories/IChat.repository";
import { IConversation, IMessage, ConversationModel, MessageModel } from "../models/chat.models";
import { IUser, UserModel } from "../models/user.models";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";
import { Types, FilterQuery } from "mongoose";
import {
  ConversationListResponseDto,
  MessageListResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
  ParticipantDto
} from "../dtos/chat/Chat.dto";

@injectable()
export class ChatRepository implements IChatRepository {

  async findConversationByParticipants(participant1: string, participant2: string): Promise<IConversation | null> {
    try {
      if (!Types.ObjectId.isValid(participant1) || !Types.ObjectId.isValid(participant2)) {
        return null;
      }

      return await ConversationModel.findOne({
        participants: {
          $all: [
            new Types.ObjectId(participant1),
            new Types.ObjectId(participant2)
          ]
        }
      })
        .populate('lastMessage')
        .lean()
        .exec();
    } catch (error) {
      throw new CustomError(
        "Database error while finding conversation",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createConversation(participants: string[]): Promise<IConversation> {
    try {
      const validParticipants = participants.filter(p => Types.ObjectId.isValid(p));

      if (validParticipants.length !== 2) {
        throw new CustomError("Invalid participants", StatusCode.BAD_REQUEST);
      }

      const conversation = new ConversationModel({
        participants: validParticipants.map(p => new Types.ObjectId(p)),
        lastActivity: new Date()
      });

      return await conversation.save();
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while creating conversation",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateConversationLastActivity(conversationId: string, lastMessageId?: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new CustomError("Invalid conversation ID", StatusCode.BAD_REQUEST);
      }

      const updateData: Record<string, unknown> = {
        lastActivity: new Date()
      };

      if (lastMessageId && Types.ObjectId.isValid(lastMessageId)) {
        updateData.lastMessage = new Types.ObjectId(lastMessageId);
      }

      await ConversationModel.findByIdAndUpdate(
        conversationId,
        updateData
      ).exec();
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating conversation",
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
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 50);
      const query: FilterQuery<IConversation> = {
        participants: new Types.ObjectId(userId)
      };

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const conversations = await ConversationModel.find(query)
        .populate([
          {
            path: 'participants',
            select: '_id username name profilePic community.isVerified',
            match: { _id: { $ne: new Types.ObjectId(userId) } }
          },
          {
            path: 'lastMessage',
            populate: {
              path: 'sender',
              select: '_id username name profilePic community.isVerified'
            }
          }
        ])
        .sort({ lastActivity: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = conversations.length > validLimit;
      const conversationsList = conversations.slice(0, validLimit);

      // Transform conversations
      const transformedConversations: ConversationResponseDto[] = [];

      for (const conv of conversationsList) {
        // Safe cast for populated participants
        const otherParticipants = (conv.participants as unknown as IUser[]).filter(
          p => p && p._id.toString() !== userId
        );

        if (otherParticipants.length === 0) continue;

        // Apply search filter if provided
        if (search && search.trim()) {
          const searchTerm = search.trim().toLowerCase();
          const matchesSearch = otherParticipants.some(p =>
            p.username?.toLowerCase().includes(searchTerm) ||
            p.name?.toLowerCase().includes(searchTerm)
          );

          if (!matchesSearch) continue;
        }

        const participants: ParticipantDto[] = otherParticipants.map(p => ({
          _id: p._id.toString(),
          username: p.username || '',
          name: p.name || p.username || '',
          profilePic: p.profilePic || '',
          isVerified: p.community?.isVerified || false
        }));

        const unreadCount = await this.getUnreadCount(conv._id.toString(), userId);

        let lastMessage;
        if (conv.lastMessage) {
          const msg = conv.lastMessage as unknown as IMessage & { sender: IUser };
          lastMessage = {
            _id: msg._id.toString(),
            conversationId: conv._id.toString(),
            sender: {
              _id: msg.sender._id.toString(),
              username: msg.sender.username || '',
              name: msg.sender.name || msg.sender.username || '',
              profilePic: msg.sender.profilePic || '',
              // Access property safely via casting if needed or standard if defined
              isVerified: msg.sender.community?.isVerified || false
            },
            content: msg.content,
            messageType: msg.messageType,
            readBy: msg.readBy || [],
            editedAt: msg.editedAt,
            isDeleted: msg.isDeleted,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            isOwnMessage: msg.sender._id.toString() === userId
          };
        }

        transformedConversations.push({
          _id: conv._id.toString(),
          participants,
          lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        });
      }

      const totalCount = await ConversationModel.countDocuments({
        participants: new Types.ObjectId(userId)
      });

      return {
        conversations: transformedConversations,
        hasMore,
        nextCursor: hasMore && conversationsList.length > 0
          ? conversationsList[conversationsList.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting conversations",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createMessage(conversationId: string, senderId: string, content: string): Promise<IMessage> {
    try {
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(senderId)) {
        throw new CustomError("Invalid conversation or sender ID", StatusCode.BAD_REQUEST);
      }

      const message = new MessageModel({
        conversationId: new Types.ObjectId(conversationId),
        sender: new Types.ObjectId(senderId),
        content: content.trim(),
        readBy: [{
          user: new Types.ObjectId(senderId),
          readAt: new Date()
        }]
      });

      const savedMessage = await message.save();

      await this.updateConversationLastActivity(conversationId, savedMessage.id.toString());

      return await MessageModel.findById(savedMessage._id)
        .populate('sender', '_id username name profilePic community.isVerified')
        .lean()
        .exec() as IMessage;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while creating message",
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
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid conversation or user ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 100);
      const query: FilterQuery<IMessage> = {
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false
      };

      // Add cursor-based pagination (going backwards in time)
      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const messages = await MessageModel.find(query)
        .populate('sender', '_id username name profilePic community.isVerified')
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = messages.length > validLimit;
      const messagesList = messages.slice(0, validLimit);

      // Transform messages
      const transformedMessages: MessageResponseDto[] = messagesList.map(msg => {
        const sender = msg.sender as unknown as IUser;
        return {
          _id: msg._id.toString(),
          conversationId: msg.conversationId.toString(),
          sender: {
            _id: sender._id.toString(),
            username: sender.username || '',
            name: sender.name || sender.username || '',
            profilePic: sender.profilePic || '',
            isVerified: sender.community?.isVerified || false
          },
          content: msg.content,
          messageType: msg.messageType,
          readBy: msg.readBy.map(r => ({
            user: r.user.toString(),
            readAt: r.readAt
          })),
          editedAt: msg.editedAt,
          isDeleted: msg.isDeleted,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          isOwnMessage: msg.sender._id.toString() === userId
        };
      });

      const totalCount = await MessageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false
      });

      return {
        messages: transformedMessages.reverse(), // Reverse to show oldest first
        hasMore,
        nextCursor: hasMore && messagesList.length > 0
          ? messagesList[messagesList.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting messages",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editMessage(messageId: string, content: string): Promise<IMessage | null> {
    try {
      if (!Types.ObjectId.isValid(messageId)) {
        throw new CustomError("Invalid message ID", StatusCode.BAD_REQUEST);
      }

      return await MessageModel.findByIdAndUpdate(
        messageId,
        {
          content: content.trim(),
          editedAt: new Date()
        },
        { new: true }
      )
        .populate('sender', '_id username name profilePic community.isVerified')
        .lean()
        .exec();
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while editing message",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(messageId)) {
        throw new CustomError("Invalid message ID", StatusCode.BAD_REQUEST);
      }

      const result = await MessageModel.findByIdAndUpdate(
        messageId,
        { isDeleted: true },
        { new: true }
      ).exec();

      return !!result;
    } catch (error) {
      throw new CustomError(
        "Database error while deleting message",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid conversation or user ID", StatusCode.BAD_REQUEST);
      }

      await MessageModel.updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          'readBy.user': { $ne: new Types.ObjectId(userId) },
          isDeleted: false
        },
        {
          $addToSet: {
            readBy: {
              user: new Types.ObjectId(userId),
              readAt: new Date()
            }
          }
        }
      ).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while marking messages as read",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
        return 0;
      }

      return await MessageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        'readBy.user': { $ne: new Types.ObjectId(userId) },
        sender: { $ne: new Types.ObjectId(userId) },
        isDeleted: false
      }).exec();
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  async checkUserInConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
        return false;
      }

      const conversation = await ConversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        participants: new Types.ObjectId(userId)
      })
        .select('_id')
        .lean()
        .exec();

      return !!conversation;
    } catch (error) {
      console.error("Error checking user in conversation:", error);
      return false;
    }
  }

  async findMessageById(messageId: string): Promise<IMessage | null> {
    try {
      if (!Types.ObjectId.isValid(messageId)) {
        return null;
      }

      return await MessageModel.findById(messageId)
        .populate('sender', '_id username name profilePic community.isVerified')
        .lean()
        .exec();
    } catch (error) {
      console.error("Error finding message by ID:", error);
      return null;
    }
  }

  async getConversationById(conversationId: string): Promise<IConversation | null> {
    try {
      if (!Types.ObjectId.isValid(conversationId)) {
        return null;
      }

      return await ConversationModel.findById(conversationId)
        .populate('participants', '_id username name profilePic community.isVerified')
        .populate('lastMessage')
        .lean()
        .exec();
    } catch (error) {
      console.error("Error finding conversation by ID:", error);
      return null;
    }
  }
}