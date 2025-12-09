import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IPointsController } from "../../core/interfaces/controllers/user/IPoints.controller";
import { IPointsService } from "../../core/interfaces/services/user/IPointsService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class PointsController implements IPointsController {
  constructor(
    @inject(TYPES.IPointsService) private _pointsService: IPointsService
  ) { }

  /**
   * Performs the daily check-in for the user.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async performDailyCheckIn(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      const result = await this._pointsService.performDailyCheckIn(user.id);

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.DAILY_CHECKIN_COMPLETED,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_DAILY_CHECKIN;
      logger.error(LoggerMessages.DAILY_CHECKIN_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the daily check-in status for the user.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getCheckInStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      const status = await this._pointsService.getCheckInStatus(user.id);

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.CHECKIN_STATUS_RETRIEVED,
        data: status
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CHECKIN_STATUS;
      logger.error(LoggerMessages.GET_CHECKIN_STATUS_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the check-in calendar for a specific month and year.
   * @param req - Express Request object containing month and year.
   * @param res - Express Response object.
   */
  async getCheckInCalendar(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const calendar = await this._pointsService.getCheckInCalendar(user.id, month, year);

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.CHECKIN_CALENDAR_RETRIEVED,
        data: calendar
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CHECKIN_CALENDAR;
      logger.error(LoggerMessages.GET_CHECKIN_CALENDAR_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves points history for the user.
   * @param req - Express Request object containing pagination parameters.
   * @param res - Express Response object.
   */
  async getPointsHistory(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._pointsService.getPointsHistory(user.id, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.POINTS_HISTORY_RETRIEVED,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_POINTS_HISTORY;
      logger.error(LoggerMessages.GET_POINTS_HISTORY_ERROR, { message, stack: err.stack, userId: req.user });
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}