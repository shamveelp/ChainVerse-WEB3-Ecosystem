import type { Request, Response } from "express";

export interface IUserDexController {
  getEthPrice(req: Request, res: Response): Promise<void>;
  calculateEstimate(req: Request, res: Response): Promise<void>;
  createPaymentOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
  getUserPayments(req: Request, res: Response): Promise<void>;
}