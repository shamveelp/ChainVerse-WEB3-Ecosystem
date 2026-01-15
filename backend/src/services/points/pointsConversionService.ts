import { injectable, inject } from "inversify";
import { IPointsConversionService } from "../../core/interfaces/services/points/IPointsConversion.service";
import { IPointsConversionRepository } from "../../core/interfaces/repositories/points/IPointsConversion.repository";
import { IPointsHistoryRepository } from "../../core/interfaces/repositories/IPointsHistory.repository";
import { IConversionRateRepository } from "../../core/interfaces/repositories/points/IConversionRate.repository";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { calculateCVCFromPoints, validateConversion, POINTS_CONVERSION_CONFIG } from "../../config/pointsConversion";
import { Types } from "mongoose";
import logger from "../../utils/logger";
import { ConversionResponseDto } from "../../dtos/points/PointsConversion.dto";

@injectable()
export class PointsConversionService implements IPointsConversionService {
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

  async createConversion(userId: string, pointsToConvert: number): Promise<{
    success: boolean;
    conversionId: string;
    cvcAmount: number;
    message: string;
  }> {
    try {
      // Get current conversion rate
      const currentRate = await this._rateRepository.getCurrentRate();
      if (!currentRate || !currentRate.isActive) {
        throw new CustomError("Points conversion is currently disabled", StatusCode.BAD_REQUEST);
      }

      // Get user
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      // Validate conversion
      const rateConfig = {
        pointsPerCVC: currentRate.pointsPerCVC,
        minimumPoints: currentRate.minimumPoints,
        minimumCVC: currentRate.minimumCVC,
        claimFeeETH: currentRate.claimFeeETH,
        isActive: currentRate.isActive
      };

      const validation = validateConversion(pointsToConvert, rateConfig);
      if (!validation.isValid) {
        throw new CustomError(validation.error!, StatusCode.BAD_REQUEST);
      }

      // Check user has enough points
      if (user.totalPoints < pointsToConvert) {
        throw new CustomError("Insufficient points", StatusCode.BAD_REQUEST);
      }

      const cvcAmount = validation.cvcAmount!;

      // Create conversion record
      const conversion = await this._conversionRepository.create({
        userId,
        pointsConverted: pointsToConvert,
        cvcAmount,
        conversionRate: currentRate.pointsPerCVC,
        claimFee: parseFloat(currentRate.claimFeeETH)
      });

      // Deduct points from user
      await this._userRepository.update(userId, {
        totalPoints: user.totalPoints - pointsToConvert
      } as Record<string, unknown>);

      // Record points deduction history
      await this._pointsHistoryRepository.createPointsHistory({
        userId,
        type: 'conversion_deduction',
        points: -pointsToConvert,
        description: `Converted ${pointsToConvert} points to ${cvcAmount} CVC`,
        relatedId: conversion._id.toString()
      });

      return {
        success: true,
        conversionId: conversion._id.toString(),
        cvcAmount,
        message: `Successfully converted ${pointsToConvert} points to ${cvcAmount} CVC. Awaiting approval.`
      };
    } catch (error) {
      logger.error("PointsConversionService: Create conversion error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to create conversion", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserConversions(userId: string, page = 1, limit = 10): Promise<{
    conversions: ConversionResponseDto[];
    total: number;
    totalPages: number;
    stats: {
      totalPointsConverted: number;
      totalCVCClaimed: number;
      pendingConversions: number;
    };
  }> {
    try {
      const result = await this._conversionRepository.findByUserId(userId, page, limit);
      const stats = await this._conversionRepository.getUserTotalConversions(userId);

      return {
        conversions: result.conversions.map(conversion => ({
          id: conversion._id.toString(),
          user: {
            id: userId,
            username: '', // These would be populated if needed, but for user history they know who they are
            email: '',
            profilePic: ''
          },
          pointsConverted: conversion.pointsConverted,
          cvcAmount: conversion.cvcAmount,
          conversionRate: conversion.conversionRate,
          status: conversion.status,
          transactionHash: conversion.transactionHash,
          claimFee: conversion.claimFee,
          walletAddress: conversion.walletAddress,
          adminNote: conversion.adminNote,
          approvedBy: conversion.approvedBy?.toString(),
          approvedAt: conversion.approvedAt,
          claimedAt: conversion.claimedAt,
          createdAt: conversion.createdAt
        })),
        total: result.total,
        totalPages: result.totalPages,
        stats
      };
    } catch (error) {
      logger.error("PointsConversionService: Get user conversions error:", error);
      throw new CustomError("Failed to fetch conversions", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async claimCVC(
    conversionId: string,
    userId: string,
    walletAddress: string,
    transactionHash: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const conversion = await this._conversionRepository.findById(conversionId);
      if (!conversion) {
        throw new CustomError("Conversion not found", StatusCode.NOT_FOUND);
      }

      // Handle both populated and non-populated userId
      // When populated by mongoose, userId is an object, when not populated it's an ObjectId
      // Use mongoose's way to get the ObjectId regardless of population
      const conversionUserId = (conversion.userId as unknown as { _id?: Types.ObjectId })._id
        ? (conversion.userId as unknown as { _id: Types.ObjectId })._id.toString()
        : (conversion.userId as { toString(): string }).toString();

      // Normalize both IDs to strings for comparison
      const normalizedUserId = userId.toString();
      const normalizedConversionUserId = conversionUserId.toString();

      if (normalizedConversionUserId !== normalizedUserId) {
        logger.error(`User ID mismatch - Conversion userId: ${normalizedConversionUserId}, Request userId: ${normalizedUserId}, Conversion ID: ${conversionId}`);
        throw new CustomError("Unauthorized - This conversion does not belong to you", StatusCode.UNAUTHORIZED);
      }

      if (conversion.status !== 'approved') {
        throw new CustomError("Conversion not approved for claiming", StatusCode.BAD_REQUEST);
      }

      // Update conversion status to claimed
      await this._conversionRepository.updateStatus(conversionId, 'claimed', {
        walletAddress,
        transactionHash,
        claimedAt: new Date()
      });

      return {
        success: true,
        message: `Successfully claimed ${conversion.cvcAmount} CVC tokens`
      };
    } catch (error) {
      logger.error("PointsConversionService: Claim CVC error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to claim CVC", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCurrentConversionRate(): Promise<{
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    isActive: boolean;
    companyWallet: string;
    cvcContractAddress: string;
    network: string;
  }> {
    try {
      const rate = await this._rateRepository.getCurrentRate();
      if (!rate) {
        throw new CustomError("No conversion rate found", StatusCode.NOT_FOUND);
      }

      return {
        pointsPerCVC: rate.pointsPerCVC,
        minimumPoints: rate.minimumPoints,
        minimumCVC: rate.minimumCVC,
        claimFeeETH: rate.claimFeeETH,
        isActive: rate.isActive,
        companyWallet: POINTS_CONVERSION_CONFIG.companyWallet,
        cvcContractAddress: POINTS_CONVERSION_CONFIG.cvcContractAddress,
        network: POINTS_CONVERSION_CONFIG.network
      };
    } catch (error) {
      logger.error("PointsConversionService: Get current rate error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to get conversion rate", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async validateConversion(userId: string, pointsToConvert: number): Promise<{
    isValid: boolean;
    error?: string;
    cvcAmount?: number;
    userPoints?: number;
  }> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) {
        return { isValid: false, error: "User not found" };
      }

      const rate = await this._rateRepository.getCurrentRate();
      if (!rate) {
        return { isValid: false, error: "No conversion rate available" };
      }

      const rateConfig = {
        pointsPerCVC: rate.pointsPerCVC,
        minimumPoints: rate.minimumPoints,
        minimumCVC: rate.minimumCVC,
        claimFeeETH: rate.claimFeeETH,
        isActive: rate.isActive
      };

      if (user.totalPoints < pointsToConvert) {
        return {
          isValid: false,
          error: "Insufficient points",
          userPoints: user.totalPoints
        };
      }

      const validation = validateConversion(pointsToConvert, rateConfig);

      return {
        isValid: validation.isValid,
        error: validation.error,
        cvcAmount: validation.cvcAmount,
        userPoints: user.totalPoints
      };
    } catch (error) {
      logger.error("PointsConversionService: Validate conversion error:", error);
      return { isValid: false, error: "Validation failed" };
    }
  }
}