import { Request, Response } from "express";

export interface IWalletController {
  connectWallet(req: Request, res: Response): Promise<void>;
//   getWallet(req: Request, res: Response): Promise<void>;
  getAllWallets(req: Request, res: Response): Promise<void>;
}