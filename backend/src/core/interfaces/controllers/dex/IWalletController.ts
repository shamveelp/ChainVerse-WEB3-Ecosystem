import { Request, Response } from "express";

export interface IWalletController {
  connectWallet(req: Request, res: Response): Promise<void>;
  disconnectWallet(req: Request, res: Response): Promise<void>;
  getWalletInfo(req: Request, res: Response): Promise<void>;
  getWalletTransactions(req: Request, res: Response): Promise<void>;
  updateWalletConnection(req: Request, res: Response): Promise<void>;
}