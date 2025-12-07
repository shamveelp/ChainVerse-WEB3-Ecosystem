import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IChatController } from "../../core/interfaces/controllers/chat/IChat.controller";
import { IChatService } from "../../core/interfaces/services/chat/IChatService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";

@injectable()
export class ChatController implements IChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) { }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { content, receiverUsername } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!content || !receiverUsername) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.CONTENT_RECEIVER_REQUIRED
        });
        return;
      }

      if (typeof content !== 'string' || content.trim().length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_CONTENT_EMPTY
        });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_TOO_LONG
        });
        return;
      }

      const result = await this._chatService.sendMessage(user.id, receiverUsername, content);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.MESSAGE_SENT
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_SEND_MESSAGE;

      logger.error(LoggerMessages.SEND_MESSAGE_ERROR, {
        message,
        stack: err.stack,
        userId: req.user ? (req.user as any).id : 'unknown'
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { cursor, limit, search } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      // Validate limit
      let validLimit = 20;
      if (limit && typeof limit === 'string') {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit)) {
          validLimit = Math.min(Math.max(parsedLimit, 1), 50);
        }
      }

      const result = await this._chatService.getUserConversations(
        user.id,
        cursor as string,
        validLimit,
        search as string
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSATIONS;

      logger.error(LoggerMessages.GET_CONVERSATIONS_ERROR, {
        message,
        stack: err.stack,
        userId: req.user ? (req.user as any).id : 'unknown'
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { conversationId } = req.params;
      const { cursor, limit } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!conversationId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.CONVERSATION_ID_REQUIRED
        });
        return;
      }

      // Validate limit
      let validLimit = 20;
      if (limit && typeof limit === 'string') {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit)) {
          validLimit = Math.min(Math.max(parsedLimit, 1), 100);
        }
      }

      const result = await this._chatService.getConversationMessages(
        conversationId,
        user.id,
        cursor as string,
        validLimit
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_MESSAGES;

      logger.error(LoggerMessages.GET_MESSAGES_ERROR, {
        message,
        stack: err.stack,
        conversationId: req.params.conversationId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getOrCreateConversation(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { username } = req.params;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!username) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.USERNAME_REQUIRED
        });
        return;
      }

      const result = await this._chatService.getOrCreateConversation(user.id, username);

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CREATE_CONVERSATION;

      logger.error(LoggerMessages.GET_CREATE_CONVERSATION_ERROR, {
        message,
        stack: err.stack,
        username: req.params.username
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async editMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { messageId } = req.params;
      const { content } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!messageId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_ID_REQUIRED
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_CONTENT_EMPTY
        });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_TOO_LONG
        });
        return;
      }

      const result = await this._chatService.editMessage(messageId, user.id, content);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: SuccessMessages.MESSAGE_EDITED
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_EDIT_MESSAGE;

      logger.error(LoggerMessages.EDIT_MESSAGE_ERROR, {
        message,
        stack: err.stack,
        messageId: req.params.messageId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { messageId } = req.params;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!messageId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.MESSAGE_ID_REQUIRED
        });
        return;
      }

      const result = await this._chatService.deleteMessage(messageId, user.id);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_DELETE_MESSAGE;

      logger.error(LoggerMessages.DELETE_MESSAGE_ERROR, {
        message,
        stack: err.stack,
        messageId: req.params.messageId
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { conversationId } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!conversationId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.CONVERSATION_ID_REQUIRED
        });
        return;
      }

      const result = await this._chatService.markMessagesAsRead(conversationId, user.id);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_MARK_READ;

      logger.error(LoggerMessages.MARK_READ_ERROR, {
        message,
        stack: err.stack,
        userId: req.user ? (req.user as any).id : 'unknown'
      });

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}