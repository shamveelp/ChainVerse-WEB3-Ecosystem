import { Request, Response } from "express";

export interface IAdminMarketController {
  getCoins(req: Request, res: Response): Promise<void>;
  toggleCoinListing(req: Request, res: Response): Promise<void>;
}


