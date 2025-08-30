export interface IReferralService {
  getReferralHistory(userId: string, page: number, limit: number): Promise<{
    referrals: any[];
    total: number;
    totalPages: number;
    stats: {
      totalReferrals: number;
      totalPointsEarned: number;
    };
  }>;
  
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
    referralLink: string;
  }>;
}