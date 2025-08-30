import { injectable } from "inversify";
import { IPointsHistoryRepository } from "../core/interfaces/repositories/IPointsHistoryRepository";
import { PointsHistoryModel, IPointsHistory } from "../models/pointsHistory.model";
import { Types } from "mongoose";

@injectable()
export class PointsHistoryRepository implements IPointsHistoryRepository {
  
  async createPointsHistory(data: {
    userId: string;
    type: 'daily_checkin' | 'referral_bonus' | 'quest_reward' | 'bonus' | 'deduction';
    points: number;
    description: string;
    relatedId?: string;
  }): Promise<IPointsHistory> {
    const pointsHistory = new PointsHistoryModel({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      points: data.points,
      description: data.description,
      relatedId: data.relatedId ? new Types.ObjectId(data.relatedId) : undefined,
    });
    
    return await pointsHistory.save();
  }

  async getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: IPointsHistory[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const history = await PointsHistoryModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await PointsHistoryModel.countDocuments({ userId: new Types.ObjectId(userId) });
    
    return {
      history,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTotalPointsByType(userId: string, type: string): Promise<number> {
    const result = await PointsHistoryModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), type } },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}