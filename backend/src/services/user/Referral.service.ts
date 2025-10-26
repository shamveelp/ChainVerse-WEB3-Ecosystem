import { injectable, inject } from "inversify";
import { IReferralService } from "../../core/interfaces/services/user/IReferralService";
import { IReferralHistoryRepository } from "../../core/interfaces/repositories/IReferralHistoryRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class ReferralService implements IReferralService {
  constructor(
    @inject(TYPES.IReferralHistoryRepository) private _referralHistoryRepository: IReferralHistoryRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) {}

  async getReferralHistory(userId: string, page: number, limit: number): Promise<{
    referrals: any[];
    total: number;
    totalPages: number;
    stats: {
      totalReferrals: number;
      totalPointsEarned: number;
    };
  }> {
    try {
      
      
      const result = await this._referralHistoryRepository.findByReferrer(userId, page, limit);
      const stats = await this._referralHistoryRepository.getReferralStats(userId);
      
      return {
        referrals: result.referrals,
        total: result.total,
        totalPages: result.totalPages,
        stats,
      };
    } catch (error) {
      console.error("ReferralService: Get referral history error:", error);
      throw new CustomError("Failed to fetch referral history", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
    referralLink: string;
  }> {
    try {
      
      
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      const stats = await this._referralHistoryRepository.getReferralStats(userId);
      
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const referralLink = `${baseUrl}/user/register?ref=${user.refferalCode}`;
      
      return {
        totalReferrals: stats.totalReferrals,
        totalPointsEarned: stats.totalPointsEarned,
        referralCode: user.refferalCode,
        referralLink,
      };
    } catch (error) {
      console.error("ReferralService: Get referral stats error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to fetch referral stats", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}