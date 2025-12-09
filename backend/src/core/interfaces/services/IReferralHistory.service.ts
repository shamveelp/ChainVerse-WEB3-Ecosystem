import { IReferralHistory } from "../../../models/referralHistory.model";

export interface IReferralHistoryService {
  findByReferrer(userId: string, page: number, limit: number): Promise<{
    referrals: IReferralHistory[];
    total: number;
    totalPages: number;
  }>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
  }>;
}