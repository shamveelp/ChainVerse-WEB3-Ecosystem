import { injectable, inject } from "inversify";
import { IReferralHistoryService } from "../core/interfaces/services/IReferralHistory.service";
import { IReferralHistoryRepository } from "../core/interfaces/repositories/IReferralHistory.repository";
import { TYPES } from "../core/types/types";
import { IReferralHistory } from "../models/referralHistory.model";

@injectable()
export class ReferralHistoryService implements IReferralHistoryService {
  constructor(
    @inject(TYPES.IReferralHistoryRepository) private _referralHistoryRepository: IReferralHistoryRepository
  ) { }

  /**
   * Finds referral history by the referrer's user ID.
   * @param {string} userId - The unique identifier of the referrer.
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of items per page.
   * @returns {Promise<{ referrals: IReferralHistory[]; total: number; totalPages: number; }>} The paginated referral history.
   */
  async findByReferrer(userId: string, page: number, limit: number): Promise<{
    referrals: IReferralHistory[];
    total: number;
    totalPages: number;
  }> {
    return await this._referralHistoryRepository.findByReferrer(userId, page, limit);
  }

  /**
   * Retrieves referral statistics for a user.
   * @param {string} userId - The unique identifier of the user.
   * @returns {Promise<{ totalReferrals: number; totalPointsEarned: number; }>} The referral statistics.
   */
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