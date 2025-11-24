import { Request, Response } from "express";

export interface IDexSwapController {
  recordSwap(req: Request, res: Response): Promise<void>;
  updateSwapStatus(req: Request, res: Response): Promise<void>;
  getSwapHistory(req: Request, res: Response): Promise<void>;
  getSwapTransaction(req: Request, res: Response): Promise<void>;
  getChartData(req: Request, res: Response): Promise<void>;
  updateTokenPrice(req: Request, res: Response): Promise<void>;
  getTokenPrice(req: Request, res: Response): Promise<void>;
  getTradingPairStats(req: Request, res: Response): Promise<void>;
  getDEXStats(req: Request, res: Response): Promise<void>;
  getUserTradingStats(req: Request, res: Response): Promise<void>;
  getTopTradingPairs(req: Request, res: Response): Promise<void>;
  getRecentSwaps(req: Request, res: Response): Promise<void>;
}