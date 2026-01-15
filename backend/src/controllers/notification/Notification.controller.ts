import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { INotificationController } from "../../core/interfaces/controllers/notification/INotification.controller";
import { INotificationService } from "../../core/interfaces/services/notification/INotification.service";
import { StatusCode } from "../../enums/statusCode.enum";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class NotificationController implements INotificationController {
    constructor(
        @inject(TYPES.INotificationService) private _notificationService: INotificationService
    ) { }

    async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const unreadOnly = req.query.unreadOnly === 'true';

            const result = await this._notificationService.getUserNotifications(userId, { page, limit, unreadOnly });

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            const err = error as Error;
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message
            });
        }
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { notificationId } = req.params;

            await this._notificationService.markAsRead(userId, notificationId);

            res.status(StatusCode.OK).json({
                success: true,
                message: "Notification marked as read"
            });
        } catch (error) {
            const err = error as Error;
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message
            });
        }
    }

    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            await this._notificationService.markAllAsRead(userId);

            res.status(StatusCode.OK).json({
                success: true,
                message: "All notifications marked as read"
            });
        } catch (error) {
            const err = error as Error;
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message
            });
        }
    }

    async deleteNotification(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            if (!userId) throw new Error("User ID not found in request");

            const { notificationId } = req.params;

            await this._notificationService.deleteNotification(userId, notificationId);

            res.status(StatusCode.OK).json({
                success: true,
                message: "Notification deleted"
            });
        } catch (error) {
            const err = error as Error;
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: err.message
            });
        }
    }
}
