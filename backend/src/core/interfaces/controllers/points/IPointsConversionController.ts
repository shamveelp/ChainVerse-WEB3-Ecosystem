import { Request, Response } from "express";

export interface IPointsConversionController {
  createConversion(req: Request, res: Response): Promise<void>;
  getUserConversions(req: Request, res: Response): Promise<void>;
  claimCVC(req: Request, res: Response): Promise<void>;
  getCurrentRate(req: Request, res: Response): Promise<void>;
  validateConversion(req: Request, res: Response): Promise<void>;
}