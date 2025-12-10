import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { IAdminDashboardController } from "../../core/interfaces/controllers/admin/IAdminDashboard.controller";
import { IAdminDashboardService } from "../../core/interfaces/services/admin/IAdminDashboard.service";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class AdminDashboardController implements IAdminDashboardController {
    constructor(
        @inject(TYPES.IAdminDashboardService) private _adminDashboardService: IAdminDashboardService
    ) { }

    async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await this._adminDashboardService.getDashboardStats();
            res.status(StatusCode.OK).json({
                success: true,
                data: stats,
                message: "Dashboard stats fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}
