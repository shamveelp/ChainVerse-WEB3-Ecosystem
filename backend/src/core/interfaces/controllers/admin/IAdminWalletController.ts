import { Request, Response } from "express";

export interface IAdminWalletController {
  getAllWallets(req: Request, res: Response): Promise<void>;
  getWalletDetails(req: Request, res: Response): Promise<void>;
  getWalletStats(req: Request, res: Response): Promise<void>;
  getWalletTransactions(req: Request, res: Response): Promise<void>;
  getWalletHistoryFromEtherscan(req: Request, res: Response): Promise<void>;
  getWalletAppHistory(req: Request, res: Response): Promise<void>;
  exportWalletData(req: Request, res: Response): Promise<void>;
  refreshWalletData(req: Request, res: Response): Promise<void>;
}