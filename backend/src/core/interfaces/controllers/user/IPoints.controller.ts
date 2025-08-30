import { Request, Response } from "express";

export interface IPointsController {
  performDailyCheckIn(req: Request, res: Response): Promise<void>;
  getCheckInStatus(req: Request, res: Response): Promise<void>;
  getCheckInCalendar(req: Request, res: Response): Promise<void>;
  getPointsHistory(req: Request, res: Response): Promise<void>;
}