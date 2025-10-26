import { Request, Response } from "express";

export interface ICommunityAdminCommunityController {
    sendMessage(req: Request, res: Response): Promise<void>;
    getMessages(req: Request, res: Response): Promise<void>;
    updateMessage(req: Request, res: Response): Promise<void>;
    deleteMessage(req: Request, res: Response): Promise<void>;
    pinMessage(req: Request, res: Response): Promise<void>;
    unpinMessage(req: Request, res: Response): Promise<void>;
    getMessageReactions(req: Request, res: Response): Promise<void>;
    uploadMedia(req: Request, res: Response): Promise<void>;
}
