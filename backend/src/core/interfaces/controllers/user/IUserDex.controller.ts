import type { Request, Response } from "express";

export interface IUserDexController {
  createPaymentOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
  getUserPayments(req: Request, res: Response): Promise<void>;
  getEthPrice(req: Request, res: Response): Promise<void>;
  calculateEstimate(req: Request, res: Response): Promise<void>;
}