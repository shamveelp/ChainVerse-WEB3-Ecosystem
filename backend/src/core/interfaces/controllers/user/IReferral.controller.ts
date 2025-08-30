import { Request, Response } from "express";

export interface IReferralController {
  getReferralHistory(req: Request, res: Response): Promise<void>;
  getReferralStats(req: Request, res: Response): Promise<void>;
}