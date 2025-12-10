import { Request, Response, NextFunction } from "express";

export interface IAdminDashboardController {
    getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
