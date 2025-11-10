import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IPointsConversionController } from "../../core/interfaces/controllers/points/IPointsConversionController";
import { IPointsConversionService } from "../../core/interfaces/services/points/IPointsConversionService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";

@injectable()
export class PointsConversionController implements IPointsConversionController {
  constructor(
    @inject(TYPES.IPointsConversionService) 
    private _conversionService: IPointsConversionService
  ) {}

  async createConversion(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { pointsToConvert } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "User not authenticated"
        });
        return;
      }

      if (!pointsToConvert || pointsToConvert <= 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Valid points amount is required"
        });
        return;
      }

      const result = await this._conversionService.createConversion(user.id, pointsToConvert);

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error("PointsConversionController: Create conversion error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to create conversion";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getUserConversions(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { page = 1, limit = 10 } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "User not authenticated"
        });
        return;
      }

      const result = await this._conversionService.getUserConversions(
        user.id,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error("PointsConversionController: Get user conversions error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversions";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async claimCVC(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { conversionId, walletAddress, transactionHash } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "User not authenticated"
        });
        return;
      }

      if (!conversionId || !walletAddress || !transactionHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Conversion ID, wallet address, and transaction hash are required"
        });
        return;
      }

      const result = await this._conversionService.claimCVC(
        conversionId,
        user.id,
        walletAddress,
        transactionHash
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error("PointsConversionController: Claim CVC error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to claim CVC";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getCurrentRate(req: Request, res: Response): Promise<void> {
    try {
      const rate = await this._conversionService.getCurrentConversionRate();

      res.status(StatusCode.OK).json({
        success: true,
        data: rate
      });
    } catch (error) {
      const err = error as Error;
      logger.error("PointsConversionController: Get current rate error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversion rate";
      
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message
      });
    }
  }

  async validateConversion(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { pointsToConvert } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "User not authenticated"
        });
        return;
      }

      if (!pointsToConvert) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Points amount is required"
        });
        return;
      }

      const result = await this._conversionService.validateConversion(
        user.id,
        parseInt(pointsToConvert as string)
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error("PointsConversionController: Validate conversion error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to validate conversion";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}