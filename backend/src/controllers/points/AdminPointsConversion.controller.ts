import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminPointsConversionController } from "../../core/interfaces/controllers/points/IAdminPointsConversionController";
import { IAdminPointsConversionService } from "../../core/interfaces/services/points/IAdminPointsConversionService";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";

@injectable()
export class AdminPointsConversionController implements IAdminPointsConversionController {
  constructor(
    @inject(TYPES.IAdminPointsConversionService)
    private _conversionService: IAdminPointsConversionService
  ) { }

  /**
   * Retrieves all conversion requests.
   * @param req - Express Request object containing filter parameters.
   * @param res - Express Response object.
   */
  async getAllConversions(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const result = await this._conversionService.getAllConversions(
        parseInt(page as string),
        parseInt(limit as string),
        status as string
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_ALL_CONVERSIONS_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSIONS;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Approves a conversion request.
   * @param req - Express Request object containing conversionId in params and note in body.
   * @param res - Express Response object.
   */
  async approveConversion(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { conversionId } = req.params;
      const { adminNote } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.ADMIN_NOT_AUTHENTICATED
        });
        return;
      }

      const result = await this._conversionService.approveConversion(
        conversionId,
        admin.id,
        adminNote
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.APPROVE_CONVERSION_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_APPROVE_CONVERSION;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Rejects a conversion request.
   * @param req - Express Request object containing conversionId in params and reason in body.
   * @param res - Express Response object.
   */
  async rejectConversion(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { conversionId } = req.params;
      const { reason } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.ADMIN_NOT_AUTHENTICATED
        });
        return;
      }

      if (!reason) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.REJECTION_REASON_REQUIRED
        });
        return;
      }

      const result = await this._conversionService.rejectConversion(
        conversionId,
        admin.id,
        reason
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.REJECT_CONVERSION_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_REJECT_CONVERSION;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves conversion statistics.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getConversionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this._conversionService.getConversionStats();

      res.status(StatusCode.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_CONVERSION_STATS_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSION_STATS;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves a specific conversion request.
   * @param req - Express Request object containing conversionId.
   * @param res - Express Response object.
   */
  async getConversionById(req: Request, res: Response): Promise<void> {
    try {
      const { conversionId } = req.params;

      const conversion = await this._conversionService.getConversionById(conversionId);

      res.status(StatusCode.OK).json({
        success: true,
        data: conversion
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_CONVERSION_BY_ID_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSION;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Updates the conversion rate configuration.
   * @param req - Express Request object containing new rate details.
   * @param res - Express Response object.
   */
  async updateConversionRate(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { pointsPerCVC, minimumPoints, minimumCVC, claimFeeETH, effectiveFrom } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.ADMIN_NOT_AUTHENTICATED
        });
        return;
      }

      if (!pointsPerCVC || !minimumPoints || !minimumCVC || !claimFeeETH) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.ALL_RATE_PARAMS_REQUIRED
        });
        return;
      }

      const result = await this._conversionService.updateConversionRate(admin.id, {
        pointsPerCVC,
        minimumPoints,
        minimumCVC,
        claimFeeETH,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined
      });

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.UPDATE_CONVERSION_RATE_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_UPDATE_CONVERSION_RATE;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves historical conversion rates.
   * @param req - Express Request object containing pagination parameters.
   * @param res - Express Response object.
   */
  async getConversionRates(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;

      const result = await this._conversionService.getConversionRates(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_CONVERSION_RATES_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CONVERSION_RATES;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Retrieves the current active conversion rate.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getCurrentRate(req: Request, res: Response): Promise<void> {
    try {
      const rate = await this._conversionService.getCurrentRate();

      res.status(StatusCode.OK).json({
        success: true,
        data: rate
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_CURRENT_RATE_ERROR, err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_CURRENT_RATE;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}