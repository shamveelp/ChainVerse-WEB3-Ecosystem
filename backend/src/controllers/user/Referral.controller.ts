import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IReferralController } from "../../core/interfaces/controllers/user/IReferral.controller";
import { IReferralService } from "../../core/interfaces/services/user/IReferralService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/CustomError";
import logger from "../../utils/logger";

@injectable()
export class ReferralController implements IReferralController {
  constructor(
    @inject(TYPES.IReferralService) private _referralService: IReferralService
  ) {}

  async getReferralHistory(req: Request, res: Response): Promise<void> {
    try {
      console.log("ReferralController: Getting referral history");
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

      const result = await this._referralService.getReferralHistory(user.id, page, limit);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      console.error("ReferralController: Get referral history error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to fetch referral history";
      logger.error("Get referral history error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }

  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      console.log("ReferralController: Getting referral stats");
      const user = req.user as { id: string; role: string };
      
      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      const stats = await this._referralService.getReferralStats(user.id);
      
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: stats 
      });
    } catch (error: any) {
      console.error("ReferralController: Get referral stats error:", error);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = error.message || "Failed to fetch referral stats";
      logger.error("Get referral stats error:", { message, stack: error.stack, userId: req.user });
      res.status(statusCode).json({ 
        success: false, 
        error: message 
      });
    }
  }
}