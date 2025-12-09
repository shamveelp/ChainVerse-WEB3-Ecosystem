import { IReferralHistory } from "../../../models/referralHistory.model";

export interface IReferralHistoryRepository {
  createReferralHistory(data: {
    referrer: string;
    referred: string;
    referralCode: string;
    pointsAwarded: number;
  }): Promise<IReferralHistory>;
  
  findByReferrer(referrerId: string, page: number, limit: number): Promise<{
    referrals: IReferralHistory[];
    total: number;
    totalPages: number;
  }>;
  
  findByReferred(referredId: string): Promise<IReferralHistory | null>;
  
  getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
  }>;
}