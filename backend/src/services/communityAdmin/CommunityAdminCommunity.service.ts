import { injectable, inject } from "inversify";
import { ICommunityAdminCommunityService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminCommunity.service";
import { ICommunityMessageRepository } from "../../core/interfaces/repositories/community/ICommunityMessage.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import cloudinary from "../../config/cloudinary";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import {
    CreateCommunityMessageDto,
    UpdateCommunityMessageDto,
    CommunityMessageResponseDto,
    CommunityMessagesListResponseDto,
    MediaFileDto
} from "../../dtos/communityChat/CommunityMessage.dto";
import {
    CommunityGroupMessageResponseDto,
    CommunityGroupMessagesListResponseDto
} from "../../dtos/communityChat/CommunityGroupMessage.dto";
import { Types } from "mongoose";
import { ICommunityMessage } from "../../models/communityMessage.model";
import { ICommunityGroupMessage } from "../../models/communityGroupMessage.model";

@injectable()
export class CommunityAdminCommunityService implements ICommunityAdminCommunityService {
    constructor(
        @inject(TYPES.ICommunityMessageRepository) private _messageRepository: ICommunityMessageRepository,
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) { }

    /**
     * Sends a message to the community.
     * @param {string} adminId - Admin ID.
     * @param {CreateCommunityMessageDto} data - Message data.
     * @returns {Promise<CommunityMessageResponseDto>} Created message.
     */
    async sendMessage(adminId: string, data: CreateCommunityMessageDto): Promise<CommunityMessageResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
                throw new CustomError(ErrorMessages.FAILED_SEND_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToDTO(populatedMessage, adminId);
        } catch (error) {
            logger.error(LoggerMessages.SEND_COMMUNITY_MESSAGE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_SEND_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets community messages.
     * @param {string} adminId - Admin ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=20] - Page limit.
     * @returns {Promise<CommunityMessagesListResponseDto>} List of messages.
     */
    async getMessages(adminId: string, cursor?: string, limit: number = 20): Promise<CommunityMessagesListResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.GET_COMMUNITY_MESSAGES_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_MESSAGES, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets group messages.
     * @param {string} adminId - Admin ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=50] - Page limit.
     * @returns {Promise<CommunityGroupMessagesListResponseDto>} List of group messages.
     */
    async getGroupMessages(adminId: string, cursor?: string, limit: number = 50): Promise<CommunityGroupMessagesListResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const community = await this._communityRepository.findById(admin.communityId.toString());
            if (!community) {
                throw new CustomError(ErrorMessages.COMMUNITY_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.GET_GROUP_MESSAGES_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_GROUP_MESSAGES, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates a message.
     * @param {string} adminId - Admin ID.
     * @param {string} messageId - Message ID.
     * @param {UpdateCommunityMessageDto} data - Update data.
     * @returns {Promise<CommunityMessageResponseDto>} Updated message.
     */
    async updateMessage(adminId: string, messageId: string, data: UpdateCommunityMessageDto): Promise<CommunityMessageResponseDto> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            if (message.adminId.toString() !== adminId) {
                throw new CustomError(ErrorMessages.UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            const updatedMessage = await this._messageRepository.updateMessage(messageId, {
                content: data.content
            });

            if (!updatedMessage) {
                throw new CustomError(ErrorMessages.FAILED_UPDATE_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToDTO(updatedMessage, adminId);
        } catch (error) {
            logger.error(LoggerMessages.UPDATE_COMMUNITY_MESSAGE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPDATE_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a message.
     * @param {string} adminId - Admin ID.
     * @param {string} messageId - Message ID.
     * @returns {Promise<{ success: boolean; message: string }>} Success message.
     */
    async deleteMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            if (message.adminId.toString() !== adminId) {
                throw new CustomError(ErrorMessages.UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            const deleted = await this._messageRepository.deleteMessage(messageId);
            if (!deleted) {
                throw new CustomError(ErrorMessages.FAILED_DELETE_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return {
                success: true,
                message: SuccessMessages.MESSAGE_DELETED
            };
        } catch (error) {
            logger.error(LoggerMessages.DELETE_COMMUNITY_MESSAGE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_DELETE_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Pins a message.
     * @param {string} adminId - Admin ID.
     * @param {string} messageId - Message ID.
     * @returns {Promise<{ success: boolean; message: string }>} Success message.
     */
    async pinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError(ErrorMessages.UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            await this._messageRepository.updateMessage(messageId, { isPinned: true });

            return {
                success: true,
                message: SuccessMessages.MESSAGE_PINNED
            };
        } catch (error) {
            logger.error(LoggerMessages.PIN_COMMUNITY_MESSAGE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_PIN_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Unpins a message.
     * @param {string} adminId - Admin ID.
     * @param {string} messageId - Message ID.
     * @returns {Promise<{ success: boolean; message: string }>} Success message.
     */
    async unpinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError(ErrorMessages.UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            await this._messageRepository.updateMessage(messageId, { isPinned: false });

            return {
                success: true,
                message: SuccessMessages.MESSAGE_UNPINNED
            };
        } catch (error) {
            logger.error(LoggerMessages.UNPIN_COMMUNITY_MESSAGE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UNPIN_MESSAGE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMessageReactions(adminId: string, messageId: string): Promise<{
        messageId: string;
        reactions: Array<{ emoji: string; count: number; users: string[] }>;
        totalReactions: number;
    }> {
        try {
            const message = await this._messageRepository.getMessageById(messageId);
            if (!message) {
                throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || admin.communityId.toString() !== message.communityId.toString()) {
                throw new CustomError(ErrorMessages.UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            return {
                messageId,
                reactions: message.reactions.map(r => ({
                    emoji: r.emoji,
                    count: r.count,
                    users: r.users.map(u => u.toString())
                })),
                totalReactions: message.totalReactions
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_MESSAGE_REACTIONS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_MESSAGE_REACTIONS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Uploads media files.
     * @param {string} adminId - Admin ID.
     * @param {Express.Multer.File[]} files - Files to upload.
     * @returns {Promise<{ mediaFiles: MediaFileDto[] }>} Uploaded media.
     */
    async uploadMedia(adminId: string, files: Express.Multer.File[]): Promise<{ mediaFiles: MediaFileDto[] }> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.COMMUNITY_UPLOAD_MEDIA_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPLOAD_MEDIA, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Transforms message to DTO.
     * @param {ICommunityMessage} message - Message object.
     * @param {string} [viewerId] - Viewer ID.
     * @returns {CommunityMessageResponseDto} DTO.
     */
    private transformToDTO(message: ICommunityMessage, viewerId?: string): CommunityMessageResponseDto {
        const msg = message as unknown as {
            _id: Types.ObjectId;
            communityId: Types.ObjectId;
            adminId: { _id: Types.ObjectId; name: string; profilePicture?: string };
            content: string;
            mediaFiles?: MediaFileDto[];
            messageType: 'text' | 'media' | 'mixed';
            isPinned: boolean;
            reactions: Array<{ emoji: string; count: number; users: Types.ObjectId[] }>;
            totalReactions: number;
            isEdited: boolean;
            editedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
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

    /**
     * Transforms group message to DTO.
     * @param {ICommunityGroupMessage} message - Message object.
     * @param {string} [viewerId] - Viewer ID.
     * @returns {CommunityGroupMessageResponseDto} DTO.
     */
    private transformGroupMessageToDTO(message: ICommunityGroupMessage, viewerId?: string): CommunityGroupMessageResponseDto {
        const msg = message as unknown as {
            _id: Types.ObjectId;
            communityId: Types.ObjectId;
            senderId: { _id: Types.ObjectId; username: string; name: string; profilePic?: string };
            content: string;
            isEdited: boolean;
            editedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
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
            isCurrentUser: false, // Admin is always viewing as observer
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        };
    }
}