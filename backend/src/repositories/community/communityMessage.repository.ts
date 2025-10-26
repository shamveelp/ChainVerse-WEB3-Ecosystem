import { injectable } from "inversify";
import { ICommunityMessageRepository } from "../../core/interfaces/repositories/community/ICommunityMessageRepository";
import CommunityMessageModel, { ICommunityMessage } from "../../models/communityMessage.model";
import CommunityGroupMessageModel, { ICommunityGroupMessage } from "../../models/communityGroupMessage.model";
import { Types } from "mongoose";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class CommunityMessageRepository implements ICommunityMessageRepository {
    // Community Channel Messages
    async createMessage(messageData: Partial<ICommunityMessage>): Promise<ICommunityMessage> {
        try {
            const message = new CommunityMessageModel(messageData);
            return await message.save();
        } catch (error) {
            throw new CustomError("Database error while creating message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMessages(communityId: string, cursor?: string, limit: number = 20): Promise<{
        messages: ICommunityMessage[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }> {
        try {
            const query: any = { 
                communityId: new Types.ObjectId(communityId)
            };

            if (cursor) {
                query._id = { $lt: new Types.ObjectId(cursor) };
            }

            const messages = await CommunityMessageModel.find(query)
                .populate('adminId', 'name profilePicture')
                .sort({ isPinned: -1, createdAt: -1 })
                .limit(limit + 1)
                .lean()
                .exec();

            const hasMore = messages.length > limit;
            const resultMessages = messages.slice(0, limit);

            const totalCount = await CommunityMessageModel.countDocuments({
                communityId: new Types.ObjectId(communityId)
            });

            return {
                messages: resultMessages as ICommunityMessage[],
                hasMore,
                nextCursor: hasMore && resultMessages.length > 0
                    ? resultMessages[resultMessages.length - 1]._id.toString()
                    : undefined,
                totalCount
            };
        } catch (error) {
            throw new CustomError("Database error while fetching messages", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMessageById(messageId: string): Promise<ICommunityMessage | null> {
        try {
            return await CommunityMessageModel.findById(messageId)
                .populate('adminId', 'name profilePicture')
                .exec();
        } catch (error) {
            throw new CustomError("Database error while fetching message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateMessage(messageId: string, updateData: Partial<ICommunityMessage>): Promise<ICommunityMessage | null> {
        try {
            return await CommunityMessageModel.findByIdAndUpdate(
                messageId,
                { ...updateData, isEdited: true, editedAt: new Date() },
                { new: true }
            ).populate('adminId', 'name profilePicture').exec();
        } catch (error) {
            throw new CustomError("Database error while updating message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const result = await CommunityMessageModel.findByIdAndDelete(messageId);
            return !!result;
        } catch (error) {
            throw new CustomError("Database error while deleting message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async addReaction(messageId: string, userId: string, emoji: string): Promise<ICommunityMessage | null> {
        try {
            const message = await CommunityMessageModel.findById(messageId);
            if (!message) return null;

            const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
            
            if (reactionIndex > -1) {
                const userIndex = message.reactions[reactionIndex].users.indexOf(new Types.ObjectId(userId));
                if (userIndex === -1) {
                    message.reactions[reactionIndex].users.push(new Types.ObjectId(userId));
                    message.reactions[reactionIndex].count += 1;
                }
            } else {
                message.reactions.push({
                    emoji,
                    users: [new Types.ObjectId(userId)],
                    count: 1
                });
            }

            message.totalReactions = message.reactions.reduce((total, r) => total + r.count, 0);
            return await message.save();
        } catch (error) {
            throw new CustomError("Database error while adding reaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async removeReaction(messageId: string, userId: string, emoji: string): Promise<ICommunityMessage | null> {
        try {
            const message = await CommunityMessageModel.findById(messageId);
            if (!message) return null;

            const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
            
            if (reactionIndex > -1) {
                const userIndex = message.reactions[reactionIndex].users.indexOf(new Types.ObjectId(userId));
                if (userIndex > -1) {
                    message.reactions[reactionIndex].users.splice(userIndex, 1);
                    message.reactions[reactionIndex].count -= 1;
                    
                    if (message.reactions[reactionIndex].count === 0) {
                        message.reactions.splice(reactionIndex, 1);
                    }
                }
            }

            message.totalReactions = message.reactions.reduce((total, r) => total + r.count, 0);
            return await message.save();
        } catch (error) {
            throw new CustomError("Database error while removing reaction", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Community Group Messages
    async createGroupMessage(messageData: Partial<ICommunityGroupMessage>): Promise<ICommunityGroupMessage> {
        try {
            const message = new CommunityGroupMessageModel(messageData);
            return await message.save();
        } catch (error) {
            throw new CustomError("Database error while creating group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getGroupMessages(communityId: string, cursor?: string, limit: number = 50): Promise<{
        messages: ICommunityGroupMessage[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }> {
        try {
            const query: any = { 
                communityId: new Types.ObjectId(communityId),
                isDeleted: false
            };

            if (cursor) {
                query._id = { $lt: new Types.ObjectId(cursor) };
            }

            const messages = await CommunityGroupMessageModel.find(query)
                .populate('senderId', 'username name profilePic')
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .lean()
                .exec();

            const hasMore = messages.length > limit;
            const resultMessages = messages.slice(0, limit).reverse(); // Reverse to show oldest first

            const totalCount = await CommunityGroupMessageModel.countDocuments({
                communityId: new Types.ObjectId(communityId),
                isDeleted: false
            });

            return {
                messages: resultMessages as ICommunityGroupMessage[],
                hasMore,
                nextCursor: hasMore && messages.length > limit
                    ? messages[limit]._id.toString()
                    : undefined,
                totalCount
            };
        } catch (error) {
            throw new CustomError("Database error while fetching group messages", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getGroupMessageById(messageId: string): Promise<ICommunityGroupMessage | null> {
        try {
            return await CommunityGroupMessageModel.findById(messageId)
                .populate('senderId', 'username name profilePic')
                .exec();
        } catch (error) {
            throw new CustomError("Database error while fetching group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateGroupMessage(messageId: string, updateData: Partial<ICommunityGroupMessage>): Promise<ICommunityGroupMessage | null> {
        try {
            return await CommunityGroupMessageModel.findByIdAndUpdate(
                messageId,
                { ...updateData, isEdited: true, editedAt: new Date() },
                { new: true }
            ).populate('senderId', 'username name profilePic').exec();
        } catch (error) {
            throw new CustomError("Database error while updating group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteGroupMessage(messageId: string, userId: string): Promise<boolean> {
        try {
            const result = await CommunityGroupMessageModel.findOneAndUpdate(
                { _id: messageId, senderId: userId },
                { isDeleted: true, deletedAt: new Date() },
                { new: true }
            );
            return !!result;
        } catch (error) {
            throw new CustomError("Database error while deleting group message", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async markMessagesAsRead(communityId: string, userId: string): Promise<boolean> {
        try {
            await CommunityGroupMessageModel.updateMany(
                { 
                    communityId: new Types.ObjectId(communityId),
                    'readBy.userId': { $ne: new Types.ObjectId(userId) }
                },
                {
                    $addToSet: {
                        readBy: {
                            userId: new Types.ObjectId(userId),
                            readAt: new Date()
                        }
                    }
                }
            );
            return true;
        } catch (error) {
            throw new CustomError("Database error while marking messages as read", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}
