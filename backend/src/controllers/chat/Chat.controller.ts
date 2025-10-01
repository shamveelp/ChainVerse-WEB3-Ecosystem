import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IChatController } from "../../core/interfaces/controllers/chat/IChat.controller";
import { IChatService } from "../../core/interfaces/services/chat/IChatService";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class ChatController implements IChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) {}

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { content, receiverUsername } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "User not authenticated"
        });
        return;
      }

      if (!content || !receiverUsername) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Content and receiver username are required"
        });
        return;
      }

      if (typeof content !== 'string' || content.trim().length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message content cannot be empty"
        });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message content cannot exceed 2000 characters"
        });
        return;
      }

      const result = await this._chatService.sendMessage(user.id, receiverUsername, content);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: "Message sent successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to send message";

      logger.error("Send message error:", { 
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
          error: "User not authenticated"
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
      const message = err.message || "Failed to get conversations";

      logger.error("Get conversations error:", { 
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
          error: "User not authenticated"
        });
        return;
      }

      if (!conversationId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Conversation ID is required"
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
      const message = err.message || "Failed to get messages";

      logger.error("Get messages error:", { 
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
          error: "User not authenticated"
        });
        return;
      }

      if (!username) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Username is required"
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
      const message = err.message || "Failed to get or create conversation";

      logger.error("Get or create conversation error:", { 
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
          error: "User not authenticated"
        });
        return;
      }

      if (!messageId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message ID is required"
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message content cannot be empty"
        });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message content cannot exceed 2000 characters"
        });
        return;
      }

      const result = await this._chatService.editMessage(messageId, user.id, content);

      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        message: "Message edited successfully"
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to edit message";

      logger.error("Edit message error:", { 
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
          error: "User not authenticated"
        });
        return;
      }

      if (!messageId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Message ID is required"
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
      const message = err.message || "Failed to delete message";

      logger.error("Delete message error:", { 
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
          error: "User not authenticated"
        });
        return;
      }

      if (!conversationId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Conversation ID is required"
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
      const message = err.message || "Failed to mark messages as read";

      logger.error("Mark messages as read error:", { 
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