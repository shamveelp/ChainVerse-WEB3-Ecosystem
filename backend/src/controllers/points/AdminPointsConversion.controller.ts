import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminPointsConversionController } from "../../core/interfaces/controllers/points/IAdminPointsConversionController";
import { IAdminPointsConversionService } from "../../core/interfaces/services/points/IAdminPointsConversionService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";

@injectable()
export class AdminPointsConversionController implements IAdminPointsConversionController {
  constructor(
    @inject(TYPES.IAdminPointsConversionService) 
    private _conversionService: IAdminPointsConversionService
  ) {}

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
      logger.error("AdminPointsConversionController: Get all conversions error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversions";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async approveConversion(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { conversionId } = req.params;
      const { adminNote } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "Admin not authenticated"
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
      logger.error("AdminPointsConversionController: Approve conversion error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to approve conversion";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async rejectConversion(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { conversionId } = req.params;
      const { reason } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "Admin not authenticated"
        });
        return;
      }

      if (!reason) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Rejection reason is required"
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
      logger.error("AdminPointsConversionController: Reject conversion error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to reject conversion";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getConversionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this._conversionService.getConversionStats();

      res.status(StatusCode.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      const err = error as Error;
      logger.error("AdminPointsConversionController: Get conversion stats error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversion statistics";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

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
      logger.error("AdminPointsConversionController: Get conversion by ID error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversion";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async updateConversionRate(req: Request, res: Response): Promise<void> {
    try {
      const admin = req.user as { id: string; role: string };
      const { pointsPerCVC, minimumPoints, minimumCVC, claimFeeETH, effectiveFrom } = req.body;

      if (!admin || !admin.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: "Admin not authenticated"
        });
        return;
      }

      if (!pointsPerCVC || !minimumPoints || !minimumCVC || !claimFeeETH) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "All rate parameters are required"
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
      logger.error("AdminPointsConversionController: Update conversion rate error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to update conversion rate";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

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
      logger.error("AdminPointsConversionController: Get conversion rates error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get conversion rates";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  async getCurrentRate(req: Request, res: Response): Promise<void> {
    try {
      const rate = await this._conversionService.getCurrentRate();

      res.status(StatusCode.OK).json({
        success: true,
        data: rate
      });
    } catch (error) {
      const err = error as Error;
      logger.error("AdminPointsConversionController: Get current rate error:", err);
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to get current rate";
      
      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
}