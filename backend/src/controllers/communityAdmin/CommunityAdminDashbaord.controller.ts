import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminDashboardController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminDashboard.controller";
import { ICommunityAdminDashboardService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminDashboard.service";

@injectable()
export class CommunityAdminDashboardController implements ICommunityAdminDashboardController {
    constructor(
        @inject(TYPES.ICommunityAdminDashboardService) private _dashboardService: ICommunityAdminDashboardService
    ) {}

    async getDashboardData(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            console.log("Getting dashboard data for admin:", communityAdminId, "period:", period);

            const dashboardData = await this._dashboardService.getDashboardData(communityAdminId, period as string);

            console.log("Dashboard data retrieved successfully");
            res.status(StatusCode.OK).json({
                success: true,
                data: dashboardData
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get dashboard data error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch dashboard data";
            logger.error("Get dashboard data error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommunityOverview(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;

            console.log("Getting community overview for admin:", communityAdminId);

            const overview = await this._dashboardService.getCommunityOverview(communityAdminId);

            console.log("Community overview retrieved successfully");
            res.status(StatusCode.OK).json({
                success: true,
                data: overview
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community overview error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community overview";
            logger.error("Get community overview error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getCommunityStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            console.log("Getting community stats for admin:", communityAdminId, "period:", period);

            const stats = await this._dashboardService.getCommunityStats(communityAdminId, period as string);

            console.log("Community stats retrieved successfully");
            res.status(StatusCode.OK).json({
                success: true,
                data: stats
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community stats error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community stats";
            logger.error("Get community stats error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}
