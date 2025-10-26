import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminCommunityController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminCommunity.controller";
import { ICommunityAdminCommunityService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminCommunityService";
import { IUserCommunityChatService } from "../../core/interfaces/services/community/IUserCommunityChatService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class CommunityAdminCommunityController implements ICommunityAdminCommunityController {
    constructor(
        @inject(TYPES.ICommunityAdminCommunityService) private _communityService: ICommunityAdminCommunityService,
        @inject(TYPES.IUserCommunityChatService) private _chatService: IUserCommunityChatService
    ) {}

    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { content, mediaFiles, messageType } = req.body;

            if (!content?.trim() && (!mediaFiles || mediaFiles.length === 0)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message content or media files are required"
                });
                return;
            }

            const message = await this._communityService.sendMessage(adminId, {
                content: content?.trim() || '',
                mediaFiles: mediaFiles || [],
                messageType
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                data: message,
                message: "Message sent successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to send message";
            logger.error("Send community message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { cursor, limit = '20' } = req.query;

            let validLimit = 20;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const messages = await this._communityService.getMessages(
                adminId,
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
            const message = err.message || "Failed to get messages";
            logger.error("Get community messages error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Get group messages (admin can view)
    async getGroupMessages(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { cursor, limit = '50' } = req.query;

            let validLimit = 50;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 100);
                }
            }

            // We'll need to get the community username from admin
            // For now, we'll create a new method in the service
            const messages = await this._communityService.getGroupMessages(
                adminId,
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
            logger.error("Get group messages error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    // Admin delete group message
    async deleteGroupMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;

            const result = await this._chatService.deleteGroupMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete group message";
            logger.error("Admin delete group message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;
            const { content } = req.body;

            if (!content || content.trim() === '') {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Message content is required"
                });
                return;
            }

            const message = await this._communityService.updateMessage(adminId, messageId, {
                content: content.trim()
            });

            res.status(StatusCode.OK).json({
                success: true,
                data: message,
                message: "Message updated successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update message";
            logger.error("Update community message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async deleteMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;

            const result = await this._communityService.deleteMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to delete message";
            logger.error("Delete community message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async pinMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;

            const result = await this._communityService.pinMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to pin message";
            logger.error("Pin community message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async unpinMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;

            const result = await this._communityService.unpinMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: result.message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to unpin message";
            logger.error("Unpin community message error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMessageReactions(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const { messageId } = req.params;

            const reactions = await this._communityService.getMessageReactions(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                data: reactions
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to get message reactions";
            logger.error("Get message reactions error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async uploadMedia(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).user.id;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "No media files provided"
                });
                return;
            }

            const result = await this._communityService.uploadMedia(adminId, files);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Media uploaded successfully"
            });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to upload media";
            logger.error("Upload media error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}