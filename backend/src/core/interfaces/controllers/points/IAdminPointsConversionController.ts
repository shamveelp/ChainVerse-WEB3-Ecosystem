import { Request, Response } from "express";

export interface IAdminPointsConversionController {
  getAllConversions(req: Request, res: Response): Promise<void>;
  approveConversion(req: Request, res: Response): Promise<void>;
  rejectConversion(req: Request, res: Response): Promise<void>;
  getConversionStats(req: Request, res: Response): Promise<void>;
  getConversionById(req: Request, res: Response): Promise<void>;
  updateConversionRate(req: Request, res: Response): Promise<void>;
  getConversionRates(req: Request, res: Response): Promise<void>;
  getCurrentRate(req: Request, res: Response): Promise<void>;
}