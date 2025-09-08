import { Request, Response } from "express";

export interface IDexController {
  executeSwap(req: Request, res: Response): Promise<void>;
  getSwapQuote(req: Request, res: Response): Promise<void>;
  getTransactionHistory(req: Request, res: Response): Promise<void>;
  getTransactionDetails(req: Request, res: Response): Promise<void>;
  getAvailablePairs(req: Request, res: Response): Promise<void>;
  updateTransactionStatus(req: Request, res: Response): Promise<void>;
}