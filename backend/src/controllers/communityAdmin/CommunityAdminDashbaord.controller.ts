import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminDashboardController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminDashboard.controller";
import { ICommunityAdminDashboardService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminDashboard.service";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminDashboardController implements ICommunityAdminDashboardController {
    constructor(
        @inject(TYPES.ICommunityAdminDashboardService)
        private _dashboardService: ICommunityAdminDashboardService
    ) { }

    /**
     * Retrieves dashboard data for a given period.
     * @param req - Express Request object containing period query parameter.
     * @param res - Express Response object.
     */
    async getDashboardData(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            const dashboardData = await this._dashboardService.getDashboardData(
                communityAdminId,
                period as string
            );

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.DASHBOARD_DATA_FETCHED,
                data: dashboardData,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError
                    ? error.statusCode
                    : StatusCode.INTERNAL_SERVER_ERROR;

            const message =
                err.message || ErrorMessages.FAILED_GET_DASHBOARD_DATA;

            logger.error(LoggerMessages.GET_DASHBOARD_DATA_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    /**
     * Retrieves an overview of the community.
     * @param req - Express Request object.
     * @param res - Express Response object.
     */
    async getCommunityOverview(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;

            const overview = await this._dashboardService.getCommunityOverview(
                communityAdminId
            );

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.COMMUNITY_OVERVIEW_FETCHED,
                data: overview,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError
                    ? error.statusCode
                    : StatusCode.INTERNAL_SERVER_ERROR;

            const message =
                err.message || ErrorMessages.FAILED_GET_COMMUNITY_OVERVIEW;

            logger.error(LoggerMessages.GET_COMMUNITY_OVERVIEW_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    /**
     * Retrieves community statistics for a given period.
     * @param req - Express Request object containing period query parameter.
     * @param res - Express Response object.
     */
    async getCommunityStats(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { period = 'week' } = req.query;

            const stats = await this._dashboardService.getCommunityStats(
                communityAdminId,
                period as string
            );

            res.status(StatusCode.OK).json({
                success: true,
                message: SuccessMessages.COMMUNITY_STATS_FETCHED,
                data: stats,
            });
        } catch (error) {
            const err = error as Error;
            const statusCode =
                error instanceof CustomError
                    ? error.statusCode
                    : StatusCode.INTERNAL_SERVER_ERROR;

            const message =
                err.message || ErrorMessages.FAILED_GET_COMMUNITY_STATS;

            logger.error(LoggerMessages.GET_COMMUNITY_STATS_ERROR, {
                message,
                stack: err.stack,
                adminId: (req as any).user?.id,
            });

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }
}
