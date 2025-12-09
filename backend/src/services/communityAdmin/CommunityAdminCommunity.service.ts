import { injectable, inject } from "inversify";
import { ICommunityAdminCommunityService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminCommunity.service";
import { ICommunityMessageRepository } from "../../core/interfaces/repositories/community/ICommunityMessage.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import cloudinary from "../../config/cloudinary";
import {
    CreateCommunityMessageDto,
    UpdateCommunityMessageDto,
    CommunityMessageResponseDto,
    CommunityMessagesListResponseDto
} from "../../dtos/communityChat/CommunityMessage.dto";
import {
    CommunityGroupMessageResponseDto,
    CommunityGroupMessagesListResponseDto
} from "../../dtos/communityChat/CommunityGroupMessage.dto";

@injectable()
export class CommunityAdminCommunityService implements ICommunityAdminCommunityService {
    constructor(
        @inject(TYPES.ICommunityMessageRepository) private _messageRepository: ICommunityMessageRepository,
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async sendMessage(adminId: string, data: CreateCommunityMessageDto): Promise<CommunityMessageResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            // Determine message type
            let messageType = data.messageType || 'text';
            if (!data.messageType) {
                if (data.mediaFiles && data.mediaFiles.length > 0) {
                    messageType = data.content?.trim() ? 'mixed' : 'media';
                } else {
                    messageType = 'text';
                }
            }

            const message = await this._messageRepository.createMessage({
                communityId: admin.communityId,
                adminId: admin._id,
                content: data.content || '',
                mediaFiles: data.mediaFiles || [],
                messageType,
                reactions: [],
                totalReactions: 0
            });

            const populatedMessage = await this._messageRepository.getMessageById(message._id.toString());
            if (!populatedMessage) {
                throw new CustomError("Failed to retrieve created message", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToDTO(populatedMessage, adminId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to send message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMessages(adminId: string, cursor?: string, limit: number = 20): Promise<CommunityMessagesListResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            const result = await this._messageRepository.getMessages(
                admin.communityId.toString(),
                cursor,
                limit
            );

            const messages = result.messages.map(msg => this.transformToDTO(msg, adminId));

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
            throw new CustomError("Failed to get messages", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Get group messages for admin view
    async getGroupMessages(adminId: string, cursor?: string, limit: number = 50): Promise<CommunityGroupMessagesListResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            const community = await this._communityRepository.findById(admin.communityId.toString());
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            const result = await this._messageRepository.getGroupMessages(
                admin.communityId.toString(),
                cursor,
                limit
            );

            const messages = result.messages.map(msg => this.transformGroupMessageToDTO(msg, adminId));

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

    async updateMessage(adminId: string, messageId: string, data: UpdateCommunityMessageDto): Promise<CommunityMessageResponseDto> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            if (message.adminId.toString() !== adminId) {
                throw new CustomError("Unauthorized to edit this message", StatusCode.FORBIDDEN);
            }

            const updatedMessage = await this._messageRepository.updateMessage(messageId, {
                content: data.content
            });

            if (!updatedMessage) {
                throw new CustomError("Failed to update message", StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToDTO(updatedMessage, adminId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            if (message.adminId.toString() !== adminId) {
                throw new CustomError("Unauthorized to delete this message", StatusCode.FORBIDDEN);
            }

            const deleted = await this._messageRepository.deleteMessage(messageId);
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
            throw new CustomError("Failed to delete message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async pinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError("Unauthorized to pin this message", StatusCode.FORBIDDEN);
            }

            await this._messageRepository.updateMessage(messageId, { isPinned: true });

            return {
                success: true,
                message: "Message pinned successfully"
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to pin message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unpinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError("Unauthorized to unpin this message", StatusCode.FORBIDDEN);
            }

            await this._messageRepository.updateMessage(messageId, { isPinned: false });

            return {
                success: true,
                message: "Message unpinned successfully"
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to unpin message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMessageReactions(adminId: string, messageId: string): Promise<any> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError("Message not found", StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError("Unauthorized to view reactions", StatusCode.FORBIDDEN);
            }

            return {
                messageId,
                reactions: message.reactions,
                totalReactions: message.totalReactions
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get message reactions", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async uploadMedia(adminId: string, files: Express.Multer.File[]): Promise<{ mediaFiles: any[] }> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            const mediaFiles = [];

            for (const file of files) {
                const isImage = file.mimetype.startsWith('image/');
                const isVideo = file.mimetype.startsWith('video/');

                if (!isImage && !isVideo) {
                    continue;
                }

                const uploadResult = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    {
                        resource_type: isVideo ? 'video' : 'image',
                        folder: `communities/${admin.communityId}/messages`,
                        public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        transformation: isImage ? [
                            { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' }
                        ] : [
                            { width: 720, height: 720, crop: 'limit', quality: 'auto:good' }
                        ]
                    }
                );

                mediaFiles.push({
                    type: isVideo ? 'video' : 'image',
                    url: uploadResult.secure_url,
                    publicId: uploadResult.public_id,
                    filename: file.originalname,
                    size: file.size
                });
            }

            return { mediaFiles };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to upload media", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private transformToDTO(message: any, viewerId?: string): CommunityMessageResponseDto {
        return {
            _id: message._id.toString(),
            communityId: message.communityId.toString(),
            admin: {
                _id: message.adminId._id.toString(),
                name: message.adminId.name,
                profilePicture: message.adminId.profilePicture || ''
            },
            content: message.content,
            mediaFiles: message.mediaFiles || [],
            messageType: message.messageType,
            isPinned: message.isPinned,
            reactions: message.reactions.map((reaction: any) => ({
                emoji: reaction.emoji,
                count: reaction.count,
                userReacted: viewerId ? reaction.users.some((userId: any) => userId.toString() === viewerId) : false
            })),
            totalReactions: message.totalReactions,
            isEdited: message.isEdited,
            editedAt: message.editedAt,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };
    }

    private transformGroupMessageToDTO(message: any, viewerId?: string): CommunityGroupMessageResponseDto {
        return {
            _id: message._id.toString(),
            communityId: message.communityId.toString(),
            sender: {
                _id: message.senderId._id.toString(),
                username: message.senderId.username,
                name: message.senderId.name,
                profilePic: message.senderId.profilePic || ''
            },
            content: message.content,
            isEdited: message.isEdited,
            editedAt: message.editedAt,
            isCurrentUser: false, // Admin is always viewing as observer
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };
    }
}