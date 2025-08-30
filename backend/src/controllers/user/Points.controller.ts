import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IPointsController } from "../../core/interfaces/controllers/user/IPoints.controller";
import { IPointsService } from "../../core/interfaces/services/user/IPointsService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/CustomError";
import logger from "../../utils/logger";

@injectable()
export class PointsController implements IPointsController {
  constructor(
    @inject(TYPES.IPointsService) private _pointsService: IPointsService
  ) {}

  async performDailyCheckIn(req: Request, res: Response): Promise<void> {
    try {
      console.log("PointsController: Performing daily check-in");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      const result = await this._pointsService.performDailyCheckIn(user.id);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      console.error("PointsController: Daily check-in error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to perform daily check-in";
      logger.error("Daily check-in error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }

  async getCheckInStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log("PointsController: Getting check-in status");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      const status = await this._pointsService.getCheckInStatus(user.id);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: status 
      });
    } catch (error: any) {
      console.error("PointsController: Get check-in status error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to get check-in status";
      logger.error("Get check-in status error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }

  async getCheckInCalendar(req: Request, res: Response): Promise<void> {
    try {
      console.log("PointsController: Getting check-in calendar");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const calendar = await this._pointsService.getCheckInCalendar(user.id, month, year);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: calendar 
      });
    } catch (error: any) {
      console.error("PointsController: Get check-in calendar error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to get check-in calendar";
      logger.error("Get check-in calendar error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }

  async getPointsHistory(req: Request, res: Response): Promise<void> {
    try {
      console.log("PointsController: Getting points history");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._pointsService.getPointsHistory(user.id, page, limit);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      console.error("PointsController: Get points history error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to get points history";
      logger.error("Get points history error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }
}