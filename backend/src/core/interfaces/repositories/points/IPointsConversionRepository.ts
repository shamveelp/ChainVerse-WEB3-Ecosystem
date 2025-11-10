import { IPointsConversion } from "../../../../models/pointsConversion.model";

export interface IPointsConversionRepository {
  create(data: {
    userId: string;
    pointsConverted: number;
    cvcAmount: number;
    conversionRate: number;
    claimFee: number;
  }): Promise<IPointsConversion>;

  findById(id: string): Promise<IPointsConversion | null>;

  findByUserId(userId: string, page?: number, limit?: number): Promise<{
    conversions: IPointsConversion[];
    total: number;
    totalPages: number;
  }>;

  findByStatus(status: string, page?: number, limit?: number): Promise<{
    conversions: IPointsConversion[];
    total: number;
    totalPages: number;
  }>;

  updateStatus(
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
  ): Promise<IPointsConversion | null>;

  getConversionStats(): Promise<{
    totalConversions: number;
    totalPointsConverted: number;
    totalCVCGenerated: number;
    totalClaimed: number;
    totalPending: number;
  }>;

  getUserTotalConversions(userId: string): Promise<{
    totalPointsConverted: number;
    totalCVCClaimed: number;
    pendingConversions: number;
  }>;
}