import { Request, Response } from "express";

export interface IUserMarketController {
  getListedCoins(req: Request, res: Response): Promise<void>;
}


