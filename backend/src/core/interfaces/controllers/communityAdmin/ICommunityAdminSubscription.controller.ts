import { Request, Response } from "express";

export interface ICommunityAdminSubscriptionController {
  createOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
  getSubscription(req: Request, res: Response): Promise<void>;
  retryPayment(req: Request, res: Response): Promise<void>;
  getTimeRemaining(req: Request, res: Response): Promise<void>;
}