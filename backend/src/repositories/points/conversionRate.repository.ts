import { injectable } from "inversify";
import { IConversionRateRepository } from "../../core/interfaces/repositories/points/IConversionRate.repository";
import { ConversionRateModel, IConversionRate } from "../../models/conversionRate.model";
import { Types } from "mongoose";
import logger from "../../utils/logger";

@injectable()
export class ConversionRateRepository implements IConversionRateRepository {
  
  async create(data: {
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    isActive: boolean;
    effectiveFrom: Date;
    createdBy: string;
  }): Promise<IConversionRate> {
    try {
      const rate = new ConversionRateModel({
        pointsPerCVC: data.pointsPerCVC,
        minimumPoints: data.minimumPoints,
        minimumCVC: data.minimumCVC,
        claimFeeETH: data.claimFeeETH,
        isActive: data.isActive,
        effectiveFrom: data.effectiveFrom,
        createdBy: new Types.ObjectId(data.createdBy)
      });
      
      return await rate.save();
    } catch (error) {
      logger.error("Error creating conversion rate:", error);
      throw new Error("Database error");
    }
  }

  async findById(id: string): Promise<IConversionRate | null> {
    try {
      return await ConversionRateModel.findById(id)
        .populate('createdBy', 'username')
        .exec();
    } catch (error) {
      logger.error("Error finding conversion rate by ID:", error);
      throw new Error("Database error");
    }
  }

  async getCurrentRate(): Promise<IConversionRate | null> {
    try {
      return await ConversionRateModel.findOne({ 
        isActive: true,
        effectiveFrom: { $lte: new Date() }
      })
        .sort({ effectiveFrom: -1 })
        .populate('createdBy', 'username')
        .exec();
    } catch (error) {
      logger.error("Error getting current conversion rate:", error);
      throw new Error("Database error");
    }
  }

  async findAll(page = 1, limit = 10): Promise<{
    rates: IConversionRate[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const rates = await ConversionRateModel.find()
        .sort({ effectiveFrom: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .exec();

      const total = await ConversionRateModel.countDocuments();

      return {
        rates,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("Error finding all conversion rates:", error);
      throw new Error("Database error");
    }
  }

  async updateRate(
    id: string,
    updates: Partial<IConversionRate>
  ): Promise<IConversionRate | null> {
    try {
      return await ConversionRateModel.findByIdAndUpdate(
        id, 
        updates,
        { new: true }
      )
        .populate('createdBy', 'username')
        .exec();
    } catch (error) {
      logger.error("Error updating conversion rate:", error);
      throw new Error("Database error");
    }
  }

  async deactivateAllRates(): Promise<void> {
    try {
      await ConversionRateModel.updateMany(
        { isActive: true },
        { isActive: false }
      );
    } catch (error) {
      logger.error("Error deactivating all rates:", error);
      throw new Error("Database error");
    }
  }
}