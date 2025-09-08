import { Request, Response } from "express";

export interface IAdminDexController {
  createCoin(req: Request, res: Response): Promise<void>;
  updateCoin(req: Request, res: Response): Promise<void>;
  deleteCoin(req: Request, res: Response): Promise<void>;
  listCoin(req: Request, res: Response): Promise<void>;
  unlistCoin(req: Request, res: Response): Promise<void>;
  getAllCoins(req: Request, res: Response): Promise<void>;
  getCoinDetails(req: Request, res: Response): Promise<void>;
  deployCoin(req: Request, res: Response): Promise<void>;
  getDexStats(req: Request, res: Response): Promise<void>;
}