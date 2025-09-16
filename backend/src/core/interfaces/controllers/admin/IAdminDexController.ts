import type { Request, Response } from "express";

export interface IAdminDexController {
  getAllPayments(req: Request, res: Response): Promise<void>;
  approvePayment(req: Request, res: Response): Promise<void>;
  rejectPayment(req: Request, res: Response): Promise<void>;
  fulfillPayment(req: Request, res: Response): Promise<void>;
  getPaymentStats(req: Request, res: Response): Promise<void>;
  getPendingPayments(req: Request, res: Response): Promise<void>;
}