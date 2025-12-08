import { injectable, inject } from "inversify";
import { IAdminPointsConversionService } from "../../core/interfaces/services/points/IAdminPointsConversionService";
import { IPointsConversionRepository } from "../../core/interfaces/repositories/points/IPointsConversionRepository";
import { IConversionRateRepository } from "../../core/interfaces/repositories/points/IConversionRateRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { IPointsHistoryRepository } from "../../core/interfaces/repositories/IPointsHistoryRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

// Type for populated user
interface PopulatedUser {
  _id: any;
  username: string;
  email: string;
  profilePic: string;
}

@injectable()
export class AdminPointsConversionService implements IAdminPointsConversionService {
  constructor(
    @inject(TYPES.IPointsConversionRepository)
    private _conversionRepository: IPointsConversionRepository,
    @inject(TYPES.IConversionRateRepository)
    private _rateRepository: IConversionRateRepository,
    @inject(TYPES.IUserRepository)
    private _userRepository: IUserRepository,
    @inject(TYPES.IPointsHistoryRepository)
    private _pointsHistoryRepository: IPointsHistoryRepository
  ) { }

  async getAllConversions(page = 1, limit = 10, status?: string): Promise<{
    conversions: any[];
    total: number;
    totalPages: number;
  }> {
    try {
      // Normalize status: empty string or 'all' means show all conversions
      const normalizedStatus = status && status.trim().length > 0 && status !== 'all' ? status : 'all';
      const result = await this._conversionRepository.findByStatus(normalizedStatus, page, limit);

      return {
        conversions: result.conversions.map(conversion => {
          const user = conversion.userId as unknown as PopulatedUser;

          return {
            id: conversion._id,
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              profilePic: user.profilePic
            },
            pointsConverted: conversion.pointsConverted,
            cvcAmount: conversion.cvcAmount,
            conversionRate: conversion.conversionRate,
            status: conversion.status,
            transactionHash: conversion.transactionHash,
            claimFee: conversion.claimFee,
            walletAddress: conversion.walletAddress,
            adminNote: conversion.adminNote,
            approvedBy: conversion.approvedBy,
            approvedAt: conversion.approvedAt,
            claimedAt: conversion.claimedAt,
            createdAt: conversion.createdAt
          };
        }),
        total: result.total,
        totalPages: result.totalPages
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Get all conversions error:", error);
      throw new CustomError("Failed to fetch conversions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async approveConversion(
    conversionId: string,
    adminId: string,
    adminNote?: string
  ): Promise<{
    success: boolean;
    conversion: any;
    message: string;
  }> {
    try {
      const conversion = await this._conversionRepository.findById(conversionId);
      if (!conversion) {
        throw new CustomError("Conversion not found", StatusCode.NOT_FOUND);
      }
      if (conversion.status !== 'pending') {
        throw new CustomError("Conversion is not in pending status", StatusCode.BAD_REQUEST);
      }
      const updatedConversion = await this._conversionRepository.updateStatus(
        conversionId,
        'approved',
        {
          adminNote,
          approvedBy: adminId,
          approvedAt: new Date()
        }
      );
      return {
        success: true,
        conversion: {
          id: updatedConversion!._id,
          pointsConverted: updatedConversion!.pointsConverted,
          cvcAmount: updatedConversion!.cvcAmount,
          status: updatedConversion!.status,
          adminNote: updatedConversion!.adminNote
        },
        message: `Conversion approved. User can now claim ${updatedConversion!.cvcAmount} CVC tokens.`
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Approve conversion error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to approve conversion", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async rejectConversion(
    conversionId: string,
    adminId: string,
    reason: string
  ): Promise<{
    success: boolean;
    conversion: any;
    message: string;
  }> {
    try {
      const conversion = await this._conversionRepository.findById(conversionId);
      if (!conversion) {
        throw new CustomError("Conversion not found", StatusCode.NOT_FOUND);
      }
      if (conversion.status !== 'pending') {
        throw new CustomError("Conversion is not in pending status", StatusCode.BAD_REQUEST);
      }

      // Refund points to user
      // Helper to get userId string safely (handling populated vs non-populated)
      const userId = (conversion.userId as any)?._id
        ? (conversion.userId as any)._id.toString()
        : (conversion.userId as any).toString();

      const user = await this._userRepository.findById(userId);
      if (user) {
        // Refund points
        await this._userRepository.update(userId, {
          totalPoints: user.totalPoints + conversion.pointsConverted
        } as any);

        // Record history
        await this._pointsHistoryRepository.createPointsHistory({
          userId,
          type: 'conversion_refund',
          points: conversion.pointsConverted,
          description: `Refund: ${reason}`,
          relatedId: conversion._id.toString()
        });
      }
      const updatedConversion = await this._conversionRepository.updateStatus(
        conversionId,
        'rejected',
        {
          adminNote: reason,
          approvedBy: adminId,
          approvedAt: new Date()
        }
      );
      return {
        success: true,
        conversion: {
          id: updatedConversion!._id,
          pointsConverted: updatedConversion!.pointsConverted,
          cvcAmount: updatedConversion!.cvcAmount,
          status: updatedConversion!.status,
          adminNote: updatedConversion!.adminNote
        },
        message: "Conversion rejected successfully."
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Reject conversion error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to reject conversion", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getConversionStats(): Promise<{
    totalConversions: number;
    totalPointsConverted: number;
    totalCVCGenerated: number;
    totalClaimed: number;
    totalPending: number;
    dailyStats: any[];
  }> {
    try {
      const stats = await this._conversionRepository.getConversionStats();
      const dailyStats: any[] = []; // TODO: Implement aggregation
      return { ...stats, dailyStats };
    } catch (error) {
      logger.error("AdminPointsConversionService: Get conversion stats error:", error);
      throw new CustomError("Failed to get conversion statistics", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getConversionById(conversionId: string): Promise<any> {
    try {
      const conversion = await this._conversionRepository.findById(conversionId);
      if (!conversion) {
        throw new CustomError("Conversion not found", StatusCode.NOT_FOUND);
      }

      const user = conversion.userId as unknown as PopulatedUser;

      return {
        id: conversion._id,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        pointsConverted: conversion.pointsConverted,
        cvcAmount: conversion.cvcAmount,
        conversionRate: conversion.conversionRate,
        status: conversion.status,
        transactionHash: conversion.transactionHash,
        claimFee: conversion.claimFee,
        walletAddress: conversion.walletAddress,
        adminNote: conversion.adminNote,
        approvedBy: conversion.approvedBy,
        approvedAt: conversion.approvedAt,
        claimedAt: conversion.claimedAt,
        createdAt: conversion.createdAt
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Get conversion by ID error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get conversion", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateConversionRate(
    adminId: string,
    rateData: {
      pointsPerCVC: number;
      minimumPoints: number;
      minimumCVC: number;
      claimFeeETH: string;
      effectiveFrom?: Date;
    }
  ): Promise<{
    success: boolean;
    rate: any;
    message: string;
  }> {
    try {
      await this._rateRepository.deactivateAllRates();
      const newRate = await this._rateRepository.create({
        pointsPerCVC: rateData.pointsPerCVC,
        minimumPoints: rateData.minimumPoints,
        minimumCVC: rateData.minimumCVC,
        claimFeeETH: rateData.claimFeeETH,
        isActive: true,
        effectiveFrom: rateData.effectiveFrom || new Date(),
        createdBy: adminId
      });
      return {
        success: true,
        rate: {
          id: newRate._id,
          pointsPerCVC: newRate.pointsPerCVC,
          minimumPoints: newRate.minimumPoints,
          minimumCVC: newRate.minimumCVC,
          claimFeeETH: newRate.claimFeeETH,
          isActive: newRate.isActive,
          effectiveFrom: newRate.effectiveFrom
        },
        message: "Conversion rate updated successfully"
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Update conversion rate error:", error);
      throw new CustomError("Failed to update conversion rate", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getConversionRates(page = 1, limit = 10): Promise<{
    rates: any[];
    total: number;
    totalPages: number;
  }> {
    try {
      const result = await this._rateRepository.findAll(page, limit);
      return {
        rates: result.rates.map(rate => ({
          id: rate._id,
          pointsPerCVC: rate.pointsPerCVC,
          minimumPoints: rate.minimumPoints,
          minimumCVC: rate.minimumCVC,
          claimFeeETH: rate.claimFeeETH,
          isActive: rate.isActive,
          effectiveFrom: rate.effectiveFrom,
          createdBy: rate.createdBy,
          createdAt: rate.createdAt
        })),
        total: result.total,
        totalPages: result.totalPages
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Get conversion rates error:", error);
      throw new CustomError("Failed to get conversion rates", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCurrentRate(): Promise<any> {
    try {
      const rate = await this._rateRepository.getCurrentRate();
      if (!rate) return null;
      return {
        id: rate._id,
        pointsPerCVC: rate.pointsPerCVC,
        minimumPoints: rate.minimumPoints,
        minimumCVC: rate.minimumCVC,
        claimFeeETH: rate.claimFeeETH,
        isActive: rate.isActive,
        effectiveFrom: rate.effectiveFrom,
        createdBy: rate.createdBy,
        createdAt: rate.createdAt
      };
    } catch (error) {
      logger.error("AdminPointsConversionService: Get current rate error:", error);
      throw new CustomError("Failed to get current rate", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}