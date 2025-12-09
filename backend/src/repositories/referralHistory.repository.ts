import { injectable } from "inversify";
import { IReferralHistoryRepository } from "../core/interfaces/repositories/IReferralHistory.repository";
import { ReferralHistoryModel, IReferralHistory } from "../models/referralHistory.model";
import { Types } from "mongoose";

@injectable()
export class ReferralHistoryRepository implements IReferralHistoryRepository {
  
  async createReferralHistory(data: {
    referrer: string;
    referred: string;
    referralCode: string;
    pointsAwarded: number;
  }): Promise<IReferralHistory> {
    const referralHistory = new ReferralHistoryModel({
      referrer: new Types.ObjectId(data.referrer),
      referred: new Types.ObjectId(data.referred),
      referralCode: data.referralCode,
      pointsAwarded: data.pointsAwarded,
      status: 'completed'
    });
    
    return await referralHistory.save();
  }

  async findByReferrer(referrerId: string, page: number, limit: number): Promise<{
    referrals: IReferralHistory[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const referrals = await ReferralHistoryModel.find({ referrer: new Types.ObjectId(referrerId) })
      .populate('referred', 'username name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await ReferralHistoryModel.countDocuments({ referrer: new Types.ObjectId(referrerId) });
    
    return {
      referrals,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByReferred(referredId: string): Promise<IReferralHistory | null> {
    return await ReferralHistoryModel.findOne({ referred: new Types.ObjectId(referredId) })
      .populate('referrer', 'username name')
      .exec();
  }

  async getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
  }> {
    const stats = await ReferralHistoryModel.aggregate([
      { $match: { referrer: new Types.ObjectId(referrerId) } },
      { 
        $group: { 
          _id: null, 
          totalReferrals: { $sum: 1 },
          totalPointsEarned: { $sum: "$pointsAwarded" }
        }
      }
    ]);

    return stats.length > 0 
      ? { totalReferrals: stats[0].totalReferrals, totalPointsEarned: stats[0].totalPointsEarned }
      : { totalReferrals: 0, totalPointsEarned: 0 };
  }
}