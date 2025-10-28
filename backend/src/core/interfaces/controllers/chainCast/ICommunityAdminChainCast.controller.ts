import { Request, Response } from "express";

export interface ICommunityAdminChainCastController {
    // ChainCast management
    createChainCast(req: Request, res: Response): Promise<void>;
    getChainCasts(req: Request, res: Response): Promise<void>;
    getChainCast(req: Request, res: Response): Promise<void>;
    updateChainCast(req: Request, res: Response): Promise<void>;
    deleteChainCast(req: Request, res: Response): Promise<void>;
    
    // ChainCast control
    startChainCast(req: Request, res: Response): Promise<void>;
    endChainCast(req: Request, res: Response): Promise<void>;
    
    // Participant management
    getParticipants(req: Request, res: Response): Promise<void>;
    removeParticipant(req: Request, res: Response): Promise<void>;
    
    // Moderation
    getModerationRequests(req: Request, res: Response): Promise<void>;
    reviewModerationRequest(req: Request, res: Response): Promise<void>;
    
    // Analytics
    getAnalytics(req: Request, res: Response): Promise<void>;
    
    // Reactions
    getReactions(req: Request, res: Response): Promise<void>;
}