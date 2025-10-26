import { Request, Response } from "express";

export interface IUserCommunityChatController {
    // Community Channel (Admin Messages)
    getChannelMessages(req: Request, res: Response): Promise<void>;
    reactToMessage(req: Request, res: Response): Promise<void>;
    removeReaction(req: Request, res: Response): Promise<void>;

    // Community Group Chat
    sendGroupMessage(req: Request, res: Response): Promise<void>;
    getGroupMessages(req: Request, res: Response): Promise<void>;
    editGroupMessage(req: Request, res: Response): Promise<void>;
    deleteGroupMessage(req: Request, res: Response): Promise<void>;
    markGroupMessagesAsRead(req: Request, res: Response): Promise<void>;
}
