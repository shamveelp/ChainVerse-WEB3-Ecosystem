import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserCommunityChatController } from "../../core/interfaces/controllers/community/IUserCommunityChat.controller";
import { IUserCommunityChatService } from "../../core/interfaces/services/community/IUserCommunityChatService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class UserCommunityChatController implements IUserCommunityChatController {
    constructor(
        @inject(TYPES.IUserCommunityChatService) private _chatService: IUserCommunityChatService
    ) {}

    // Community Channel Methods
    async getChannelMessages(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.params;
            const { cursor, limit = '20' } = req.query;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community username is required"
                });
                return;
            }

            let validLimit = 20;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const messages = await this._chatService.getChannelMessages(
                user.id,
                username,
                cursor as string,
                validLimit
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: messages
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get channel messages";
            logger.error("Get channel messages error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async reactToMessage(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { messageId } = req.params;
            const { emoji } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!messageId || !emoji) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message ID and emoji are required"
                });
                return;
            }

            const result = await this._chatService.reactToMessage(user.id, messageId, emoji);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to add reaction";
            logger.error("React to message error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async removeReaction(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { messageId } = req.params;
            const { emoji } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!messageId || !emoji) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message ID and emoji are required"
                });
                return;
            }

            const result = await this._chatService.removeReaction(user.id, messageId, emoji);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to remove reaction";
            logger.error("Remove reaction error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Community Group Chat Methods
    async sendGroupMessage(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { communityUsername, content } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!communityUsername || !content || content.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community username and message content are required"
                });
                return;
            }

            const message = await this._chatService.sendGroupMessage(user.id, {
                communityUsername,
                content: content.trim()
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                data: message,
                message: "Message sent successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to send group message";
            logger.error("Send group message error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getGroupMessages(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.params;
            const { cursor, limit = '50' } = req.query;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community username is required"
                });
                return;
            }

            let validLimit = 50;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 100);
                }
            }

            const messages = await this._chatService.getGroupMessages(
                user.id,
                username,
                cursor as string,
                validLimit
            );

            res.status(StatusCode.OK).json({
                success: true,
                data: messages
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get group messages";
            logger.error("Get group messages error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async editGroupMessage(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { messageId } = req.params;
            const { content } = req.body;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!content || content.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message content is required"
                });
                return;
            }

            const message = await this._chatService.editGroupMessage(user.id, messageId, content.trim());

            res.status(StatusCode.OK).json({
                success: true,
                data: message,
                message: "Message updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to edit group message";
            logger.error("Edit group message error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async deleteGroupMessage(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { messageId } = req.params;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            const result = await this._chatService.deleteGroupMessage(user.id, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete group message";
            logger.error("Delete group message error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async markGroupMessagesAsRead(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { id: string; role: string };
            const { username } = req.params;

            if (!user || !user.id) {
                res.status(StatusCode.UNAUTHORIZED).json({
                    success: false,
                    error: "User not authenticated"
                });
                return;
            }

            if (!username) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Community username is required"
                });
                return;
            }

            const result = await this._chatService.markGroupMessagesAsRead(user.id, username);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to mark messages as read";
            logger.error("Mark group messages as read error:", { message, stack: err.stack, userId: req.user ? (req.user as any).id : 'unknown' });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}
