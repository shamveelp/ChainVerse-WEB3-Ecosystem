import { inject, injectable } from "inversify";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminCommunityController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminCommunity.controller";
import { ICommunityAdminCommunityService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminCommunity.service";
import { IUserCommunityChatService } from "../../core/interfaces/services/community/IUserCommunityChat.service";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminCommunityController implements ICommunityAdminCommunityController {
    constructor(
        @inject(TYPES.ICommunityAdminCommunityService)
        private _communityService: ICommunityAdminCommunityService,
        @inject(TYPES.IUserCommunityChatService)
        private _chatService: IUserCommunityChatService
    ) { }

    /**
     * Sends a message to the community channel or group.
     * @param req - Express Request object containing message content and type.
     * @param res - Express Response object.
     */
    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { content, mediaFiles, messageType } = req.body;

            if (!content?.trim() && (!mediaFiles || mediaFiles.length === 0)) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.MESSAGE_CONTENT_REQUIRED
                });
                return;
            }

            const message = await this._communityService.sendMessage(adminId, {
                content: content?.trim() || "",
                mediaFiles: mediaFiles || [],
                messageType
            });

            res.status(StatusCode.CREATED).json({
                success: true,
                message: SuccessMessages.MESSAGE_SENT,
                data: message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_SEND_MESSAGE;

            logger.error(LoggerMessages.SEND_COMMUNITY_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Retrieves messages from the community channel.
     * @param req - Express Request object containing pagination parameters.
     * @param res - Express Response object.
     */
    async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { cursor, limit = "20" } = req.query;

            const validLimit = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 50);

            const messages = await this._communityService.getMessages(adminId, cursor as string, validLimit);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_REACTIONS_FETCHED,
                data: messages
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_MESSAGES;

            logger.error(LoggerMessages.GET_COMMUNITY_MESSAGES_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Retrieves messages from the community group.
     * @param req - Express Request object containing pagination parameters.
     * @param res - Express Response object.
     */
    async getGroupMessages(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { cursor, limit = "50" } = req.query;

            const validLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);

            const messages = await this._communityService.getGroupMessages(adminId, cursor as string, validLimit);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_REACTIONS_FETCHED,
                data: messages
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_GROUP_MESSAGES;

            logger.error(LoggerMessages.GET_GROUP_MESSAGES_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Deletes a message from the group chat.
     * @param req - Express Request object containing messageId in params.
     * @param res - Express Response object.
     */
    async deleteGroupMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;

            const result = await this._chatService.deleteGroupMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_DELETED,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_GROUP_MESSAGE;

            logger.error(LoggerMessages.DELETE_GROUP_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Updates a previously sent message.
     * @param req - Express Request object containing messageId in params and new content.
     * @param res - Express Response object.
     */
    async updateMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;
            const { content } = req.body;

            if (!content?.trim()) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.MESSAGE_CONTENT_REQUIRED
                });
                return;
            }

            const message = await this._communityService.updateMessage(adminId, messageId, {
                content: content.trim()
            });

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_UPDATED,
                data: message
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPDATE_MESSAGE;

            logger.error(LoggerMessages.UPDATE_COMMUNITY_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Deletes a message from the community channel.
     * @param req - Express Request object containing messageId in params.
     * @param res - Express Response object.
     */
    async deleteMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;

            const result = await this._communityService.deleteMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_DELETED,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_DELETE_MESSAGE;

            logger.error(LoggerMessages.DELETE_COMMUNITY_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Pins a message in the community channel.
     * @param req - Express Request object containing messageId in params.
     * @param res - Express Response object.
     */
    async pinMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;

            const result = await this._communityService.pinMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_PINNED,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_PIN_MESSAGE;

            logger.error(LoggerMessages.PIN_COMMUNITY_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Unpins a message in the community channel.
     * @param req - Express Request object containing messageId in params.
     * @param res - Express Response object.
     */
    async unpinMessage(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;

            const result = await this._communityService.unpinMessage(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_UNPINNED,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UNPIN_MESSAGE;

            logger.error(LoggerMessages.UNPIN_COMMUNITY_MESSAGE_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Retrieves reactions for a specific message.
     * @param req - Express Request object containing messageId in params.
     * @param res - Express Response object.
     */
    async getMessageReactions(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const { messageId } = req.params;

            const reactions = await this._communityService.getMessageReactions(adminId, messageId);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MESSAGE_REACTIONS_FETCHED,
                data: reactions
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_GET_MESSAGE_REACTIONS;

            logger.error(LoggerMessages.GET_MESSAGE_REACTIONS_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }

    /**
     * Uploads media files for a message.
     * @param req - Express Request object containing files.
     * @param res - Express Response object.
     */
    async uploadMedia(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as AuthenticatedRequest).user!.id;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: ErrorMessages.NO_MEDIA_FILES
                });
                return;
            }

            const result = await this._communityService.uploadMedia(adminId, files);

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.MEDIA_UPLOADED,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || ErrorMessages.FAILED_UPLOAD_MEDIA;

            logger.error(LoggerMessages.COMMUNITY_UPLOAD_MEDIA_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as AuthenticatedRequest).user?.id
            });

            res.status(statusCode).json({ success: false, error: message });
        }
    }
}
