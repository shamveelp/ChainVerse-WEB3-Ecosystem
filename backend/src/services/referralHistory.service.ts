import { injectable, inject } from "inversify";
import { IReferralHistoryService } from "../core/interfaces/services/IReferralHistory.service";
import { IReferralHistoryRepository } from "../core/interfaces/repositories/IReferralHistory.repository";
import { TYPES } from "../core/types/types";
import { IReferralHistory } from "../models/referralHistory.model";

@injectable()
export class ReferralHistoryService implements IReferralHistoryService {
  constructor(
    @inject(TYPES.IReferralHistoryRepository) private _referralHistoryRepository: IReferralHistoryRepository
  ) {}

  async findByReferrer(userId: string, page: number, limit: number): Promise<{
    referrals: IReferralHistory[];
    total: number;
    totalPages: number;
  }> {
    return await this._referralHistoryRepository.findByReferrer(userId, page, limit);
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
  }> {
    const { referrals, total } = await this._referralHistoryRepository.findByReferrer(userId, 1, 0); // Fetch all for stats
    const totalPointsEarned = referrals.reduce((sum, referral) => sum + (referral.pointsAwarded || 0), 0);
    
    return {
      totalReferrals: total,
      totalPointsEarned,
    };
  }
}