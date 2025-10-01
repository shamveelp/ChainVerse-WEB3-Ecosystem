import { Request, Response } from "express";

export interface IChatController {
  sendMessage(req: Request, res: Response): Promise<void>;
  getUserConversations(req: Request, res: Response): Promise<void>;
  getConversationMessages(req: Request, res: Response): Promise<void>;
  getOrCreateConversation(req: Request, res: Response): Promise<void>;
  editMessage(req: Request, res: Response): Promise<void>;
  deleteMessage(req: Request, res: Response): Promise<void>;
  markMessagesAsRead(req: Request, res: Response): Promise<void>;
}