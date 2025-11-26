import { Request, Response } from "express";

export interface IAITradingController {
    sendMessage(req: Request, res: Response): Promise<void>;
    analyzeTradeOpportunity(req: Request, res: Response): Promise<void>;
    getAvailableTokens(req: Request, res: Response): Promise<void>;
    calculateSwapEstimate(req: Request, res: Response): Promise<void>;
    getChatHistory(req: Request, res: Response): Promise<void>;
    getTokenPrices(req: Request, res: Response): Promise<void>;
    executeTradeWithAI(req: Request, res: Response): Promise<void>;
}