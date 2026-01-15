import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IPointsConversionController } from "../../core/interfaces/controllers/points/IPointsConversionController";
import { IPointsConversionService } from "../../core/interfaces/services/points/IPointsConversion.service";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class PointsConversionController implements IPointsConversionController {
  constructor(
    @inject(TYPES.IPointsConversionService)
    private _conversionService: IPointsConversionService
  ) { }

  /**
   * Initiates a points conversion request.
   * @param req - Express Request object containing pointsToConvert.
   * @param res - Express Response object.
   */
  async createConversion(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { pointsToConvert } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!pointsToConvert || pointsToConvert <= 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.VALID_POINTS_REQUIRED
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
      logger.error(LoggerMessages.CREATE_CONVERSION_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CREATE_CONVERSION;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the user's conversion history.
   * @param req - Express Request object containing pagination parameters.
   * @param res - Express Response object.
   */
  async getUserConversions(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { page = 1, limit = 10 } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
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
      logger.error(LoggerMessages.GET_USER_CONVERSIONS_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSIONS;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Claims CVC tokens for an approved conversion.
   * @param req - Express Request object containing conversionId, walletAddress, and transactionHash.
   * @param res - Express Response object.
   */
  async claimCVC(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { conversionId, walletAddress, transactionHash } = req.body;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!conversionId || !walletAddress || !transactionHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.CONVERSION_CLAIM_PARAMS_REQUIRED
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
      logger.error(LoggerMessages.CLAIM_CVC_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CLAIM_CVC;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the current conversion rate.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getCurrentRate(req: Request, res: Response): Promise<void> {
    try {
      const rate = await this._conversionService.getCurrentConversionRate();

      res.status(StatusCode.OK).json({
        success: true,
        data: rate
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_CURRENT_RATE_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSION_RATE;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Validates a potential conversion request.
   * @param req - Express Request object containing pointsToConvert.
   * @param res - Express Response object.
   */
  async validateConversion(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; role: string };
      const { pointsToConvert } = req.query;

      if (!user || !user.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.USER_NOT_AUTHENTICATED
        });
        return;
      }

      if (!pointsToConvert) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.POINTS_AMOUNT_REQUIRED
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
      logger.error(LoggerMessages.VALIDATE_CONVERSION_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_VALIDATE_CONVERSION;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}