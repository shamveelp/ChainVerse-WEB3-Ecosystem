import { injectable } from "inversify";
import { IPointsConversionRepository } from "../../core/interfaces/repositories/points/IPointsConversion.repository";
import { PointsConversionModel, IPointsConversion } from "../../models/pointsConversion.model";
import { Types } from "mongoose";
import logger from "../../utils/logger";

@injectable()
export class PointsConversionRepository implements IPointsConversionRepository {
  
  async create(data: {
    userId: string;
    pointsConverted: number;
    cvcAmount: number;
    conversionRate: number;
    claimFee: number;
  }): Promise<IPointsConversion> {
    try {
      const conversion = new PointsConversionModel({
        userId: new Types.ObjectId(data.userId),
        pointsConverted: data.pointsConverted,
        cvcAmount: data.cvcAmount,
        conversionRate: data.conversionRate,
        claimFee: data.claimFee
      });
      
      return await conversion.save();
    } catch (error) {
      logger.error("Error creating points conversion:", error);
      throw new Error("Database error");
    }
  }

  async findById(id: string): Promise<IPointsConversion | null> {
    try {
      return await PointsConversionModel.findById(id)
        .populate('userId', 'username email')
        .populate('approvedBy', 'username')
        .exec();
    } catch (error) {
      logger.error("Error finding points conversion by ID:", error);
      throw new Error("Database error");
    }
  }

  async findByUserId(userId: string, page = 1, limit = 10): Promise<{
    conversions: IPointsConversion[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const conversions = await PointsConversionModel.find({ 
        userId: new Types.ObjectId(userId) 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('approvedBy', 'username')
        .exec();

      const total = await PointsConversionModel.countDocuments({ 
        userId: new Types.ObjectId(userId) 
      });

      return {
        conversions,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("Error finding conversions by user ID:", error);
      throw new Error("Database error");
    }
  }

  async findByStatus(status: string, page = 1, limit = 10): Promise<{
    conversions: IPointsConversion[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // If status is 'all', don't filter by status
      const query = status === 'all' ? {} : { status };
      
      const conversions = await PointsConversionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email profilePic')
        .populate('approvedBy', 'username')
        .exec();

      const total = await PointsConversionModel.countDocuments(query);

      return {
        conversions,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("Error finding conversions by status:", error);
      throw new Error("Database error");
    }
  }

  async updateStatus(
    id: string, 
    status: 'pending' | 'approved' | 'rejected' | 'claimed',
    updateData?: {
      adminNote?: string;
      approvedBy?: string;
      approvedAt?: Date;
      claimedAt?: Date;
      transactionHash?: string;
      walletAddress?: string;
    }
  ): Promise<IPointsConversion | null> {
    try {
      const updateObj: any = { status };
      
      if (updateData) {
        if (updateData.adminNote) updateObj.adminNote = updateData.adminNote;
        if (updateData.approvedBy) updateObj.approvedBy = new Types.ObjectId(updateData.approvedBy);
        if (updateData.approvedAt) updateObj.approvedAt = updateData.approvedAt;
        if (updateData.claimedAt) updateObj.claimedAt = updateData.claimedAt;
        if (updateData.transactionHash) updateObj.transactionHash = updateData.transactionHash;
        if (updateData.walletAddress) updateObj.walletAddress = updateData.walletAddress;
      }

      return await PointsConversionModel.findByIdAndUpdate(
        id, 
        updateObj,
        { new: true }
      )
        .populate('userId', 'username email')
        .populate('approvedBy', 'username')
        .exec();
    } catch (error) {
      logger.error("Error updating conversion status:", error);
      throw new Error("Database error");
    }
  }

  async getConversionStats(): Promise<{
    totalConversions: number;
    totalPointsConverted: number;
    totalCVCGenerated: number;
    totalClaimed: number;
    totalPending: number;
  }> {
    try {
      const stats = await PointsConversionModel.aggregate([
        {
          $group: {
            _id: null,
            totalConversions: { $sum: 1 },
            totalPointsConverted: { $sum: "$pointsConverted" },
            totalCVCGenerated: { $sum: "$cvcAmount" },
            totalClaimed: {
              $sum: { $cond: [{ $eq: ["$status", "claimed"] }, "$cvcAmount", 0] }
            },
            totalPending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        totalConversions: 0,
        totalPointsConverted: 0,
        totalCVCGenerated: 0,
        totalClaimed: 0,
        totalPending: 0
      };
    } catch (error) {
      logger.error("Error getting conversion stats:", error);
      throw new Error("Database error");
    }
  }

  async getUserTotalConversions(userId: string): Promise<{
    totalPointsConverted: number;
    totalCVCClaimed: number;
    pendingConversions: number;
  }> {
    try {
      const stats = await PointsConversionModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalPointsConverted: { $sum: "$pointsConverted" },
            totalCVCClaimed: {
              $sum: { $cond: [{ $eq: ["$status", "claimed"] }, "$cvcAmount", 0] }
            },
            pendingConversions: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        totalPointsConverted: 0,
        totalCVCClaimed: 0,
        pendingConversions: 0
      };
    } catch (error) {
      logger.error("Error getting user conversion stats:", error);
      throw new Error("Database error");
    }
  }
}