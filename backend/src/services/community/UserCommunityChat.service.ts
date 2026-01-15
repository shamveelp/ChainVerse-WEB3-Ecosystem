import { injectable, inject } from "inversify";
import { IUserCommunityChatService } from "../../core/interfaces/services/community/IUserCommunityChat.service";
import { ICommunityMessageRepository } from "../../core/interfaces/repositories/community/ICommunityMessage.repository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import {
    CommunityMessagesListResponseDto,
    CommunityMessageResponseDto
} from "../../dtos/communityChat/CommunityMessage.dto";
import {
    SendGroupMessageDto,
    CommunityGroupMessageResponseDto,
    CommunityGroupMessagesListResponseDto
} from "../../dtos/communityChat/CommunityGroupMessage.dto";
import { Types } from "mongoose";
import { ICommunityGroupMessage } from "../../models/communityGroupMessage.model";
import { ICommunityMessage } from "../../models/communityMessage.model";

@injectable()
export class UserCommunityChatService implements IUserCommunityChatService {
    constructor(
        @inject(TYPES.ICommunityMessageRepository) private _messageRepository: ICommunityMessageRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository,
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository
    ) { }

    // Community Channel Methods
    async getChannelMessages(userId: string, communityUsername: string, cursor?: string, limit: number = 20): Promise<CommunityMessagesListResponseDto> {
        try {
            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            if (!memberStatus.isMember) {
                throw new CustomError("You must be a member to view messages", StatusCode.FORBIDDEN);
            }

            const result = await this._messageRepository.getMessages(
                community._id.toString(),
                cursor,
                limit
            );

            const messages = result.messages.map(msg => this.transformChannelMessageToDTO(msg as ICommunityMessage, userId));

            return {
                messages,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.totalCount
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get channel messages", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async reactToMessage(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: Array<{ emoji: string; count: number; userReacted: boolean }> }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member of the community
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, message.communityId.toString());
            if (!memberStatus.isMember) {
                throw new CustomError("You must be a member to react to messages", StatusCode.FORBIDDEN);
            }

            const updatedMessage = await this._messageRepository.addReaction(messageId, userId, emoji);
            if (!updatedMessage) {
                throw new CustomError("Failed to add reaction", StatusCode.INTERNAL_SERVER_ERROR);
            }

            const reactions = updatedMessage.reactions.map(reaction => ({
                emoji: reaction.emoji,
                count: reaction.count,
                userReacted: reaction.users.some(uid => uid.toString() === userId)
            }));

            return {
                success: true,
                message: "Reaction added successfully",
                reactions
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to add reaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async removeReaction(userId: string, messageId: string, emoji: string): Promise<{ success: boolean; message: string; reactions: Array<{ emoji: string; count: number; userReacted: boolean }> }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member of the community
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, message.communityId.toString());
            if (!memberStatus.isMember) {
                throw new CustomError("You must be a member to react to messages", StatusCode.FORBIDDEN);
            }

            const updatedMessage = await this._messageRepository.removeReaction(messageId, userId, emoji);
            if (!updatedMessage) {
                throw new CustomError("Failed to remove reaction", StatusCode.INTERNAL_SERVER_ERROR);
            }

            const reactions = updatedMessage.reactions.map(reaction => ({
                emoji: reaction.emoji,
                count: reaction.count,
                userReacted: reaction.users.some(uid => uid.toString() === userId)
            }));

            return {
                success: true,
                message: "Reaction removed successfully",
                reactions
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to remove reaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Community Group Chat Methods
    async sendGroupMessage(userId: string, data: SendGroupMessageDto): Promise<CommunityGroupMessageResponseDto> {
        try {
            const community = await this._communityRepository.findCommunityByUsername(data.communityUsername || '');
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member and group chat is enabled
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            let isAuthorized = memberStatus.isMember;

            if (!isAuthorized) {
                // Check if user is community admin
                const admin = await this._adminRepository.findById(userId);
                if (admin && admin.communityId.toString() === community._id.toString()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                throw new CustomError("You must be a member or admin to send messages", StatusCode.FORBIDDEN);
            }

            if (!community.settings?.allowGroupChat) {
                throw new CustomError("Group chat is not enabled for this community", StatusCode.FORBIDDEN);
            }

            const message = await this._messageRepository.createGroupMessage({
                communityId: community._id,
                senderId: new Types.ObjectId(userId) as unknown as Types.ObjectId,
                content: data.content.trim()
            });

            const populatedMessage = await this._messageRepository.getGroupMessageById(message._id.toString());
            if (!populatedMessage) {
                throw new CustomError("Failed to retrieve created message", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformGroupMessageToDTO(populatedMessage, userId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to send group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getGroupMessages(userId: string, communityUsername: string, cursor?: string, limit: number = 50): Promise<CommunityGroupMessagesListResponseDto> {
        try {
            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member or admin
            let hasAccess = false;
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());

            if (memberStatus.isMember) {
                hasAccess = true;
            } else {
                // Check if user is community admin
                const admin = await this._adminRepository.findById(userId);
                if (admin && admin.communityId.toString() === community._id.toString()) {
                    hasAccess = true;
                }
            }

            if (!hasAccess) {
                throw new CustomError("You must be a member or admin to view messages", StatusCode.FORBIDDEN);
            }

            if (!community.settings?.allowGroupChat) {
                throw new CustomError("Group chat is not enabled for this community", StatusCode.FORBIDDEN);
            }

            const result = await this._messageRepository.getGroupMessages(
                community._id.toString(),
                cursor,
                limit
            );

            const messages = result.messages.map(msg => this.transformGroupMessageToDTO(msg as ICommunityGroupMessage, userId));

            return {
                messages,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.totalCount
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get group messages", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async editGroupMessage(userId: string, messageId: string, content: string): Promise<CommunityGroupMessageResponseDto> {
        try {
            const message = await this._messageRepository.getGroupMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            if (message.senderId.toString() !== userId) {
                throw new CustomError("Unauthorized to edit this message", StatusCode.FORBIDDEN);
            }

            const updatedMessage = await this._messageRepository.updateGroupMessage(messageId, {
                content: content.trim()
            });

            if (!updatedMessage) {
                throw new CustomError("Failed to update message", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformGroupMessageToDTO(updatedMessage, userId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to edit group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteGroupMessage(userId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getGroupMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            // Check if user is the sender or admin
            let canDelete = false;

            if (message.senderId.toString() === userId) {
                canDelete = true;
            } else {
                // Check if user is community admin
                const admin = await this._adminRepository.findById(userId);
                if (admin && admin.communityId.toString() === message.communityId.toString()) {
                    canDelete = true;
                }
            }

            if (!canDelete) {
                throw new CustomError("Unauthorized to delete this message", StatusCode.FORBIDDEN);
            }

            const deleted = await this._messageRepository.deleteGroupMessage(messageId, userId);
            if (!deleted) {
                throw new CustomError("Failed to delete message", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return {
                success: true,
                message: "Message deleted successfully"
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to delete group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async markGroupMessagesAsRead(userId: string, communityUsername: string): Promise<{ success: boolean; message: string }> {
        try {
            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            // Check if user is a member
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            if (!memberStatus.isMember) {
                throw new CustomError("You must be a member to mark messages as read", StatusCode.FORBIDDEN);
            }

            const marked = await this._messageRepository.markMessagesAsRead(community._id.toString(), userId);
            if (!marked) {
                throw new CustomError("Failed to mark messages as read", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return {
                success: true,
                message: "Messages marked as read successfully"
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to mark messages as read", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private transformChannelMessageToDTO(message: ICommunityMessage, viewerId?: string): CommunityMessageResponseDto {
        // We know that adminId is populated due to repository implementation
        const msg = message as unknown as ICommunityMessage & {
            adminId: { _id: Types.ObjectId; name: string; profilePicture?: string };
        };
        return {
            _id: msg._id.toString(),
            communityId: msg.communityId.toString(),
            admin: {
                _id: msg.adminId._id.toString(),
                name: msg.adminId.name,
                profilePicture: msg.adminId.profilePicture || ''
            },
            content: msg.content,
            mediaFiles: msg.mediaFiles || [],
            messageType: msg.messageType,
            isPinned: msg.isPinned,
            reactions: msg.reactions.map((reaction) => ({
                emoji: reaction.emoji,
                count: reaction.count,
                userReacted: viewerId ? reaction.users.some(uid => uid.toString() === viewerId) : false
            })),
            totalReactions: msg.totalReactions,
            isEdited: msg.isEdited,
            editedAt: msg.editedAt,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        };
    }

    private transformGroupMessageToDTO(message: ICommunityGroupMessage, viewerId?: string): CommunityGroupMessageResponseDto {
        // We know that senderId is populated due to repository implementation
        const msg = message as unknown as ICommunityGroupMessage & {
            senderId: { _id: Types.ObjectId; username: string; name: string; profilePic?: string };
        };
        return {
            _id: msg._id.toString(),
            communityId: msg.communityId.toString(),
            sender: {
                _id: msg.senderId._id.toString(),
                username: msg.senderId.username,
                name: msg.senderId.name,
                profilePic: msg.senderId.profilePic || ''
            },
            content: msg.content,
            isEdited: msg.isEdited,
            editedAt: msg.editedAt,
            isCurrentUser: viewerId ? msg.senderId._id.toString() === viewerId : false,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        };
    }
}