import { Request, Response } from "express";

export interface IUserChainCastController {
    // ChainCast viewing
    getCommunityChainCasts(req: Request, res: Response): Promise<void>;
    getChainCast(req: Request, res: Response): Promise<void>;
    
    // Participation
    joinChainCast(req: Request, res: Response): Promise<void>;
    leaveChainCast(req: Request, res: Response): Promise<void>;
    updateParticipant(req: Request, res: Response): Promise<void>;
    
    // Moderation requests
    requestModeration(req: Request, res: Response): Promise<void>;
    
    // Reactions
    addReaction(req: Request, res: Response): Promise<void>;
    getReactions(req: Request, res: Response): Promise<void>;
    
    // Utility
    canJoinChainCast(req: Request, res: Response): Promise<void>;
}