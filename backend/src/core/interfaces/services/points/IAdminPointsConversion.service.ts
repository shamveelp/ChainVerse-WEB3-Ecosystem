export interface IAdminPointsConversionService {
  getAllConversions(page?: number, limit?: number, status?: string): Promise<{
    conversions: any[];
    total: number;
    totalPages: number;
  }>;

  approveConversion(
    conversionId: string,
    adminId: string,
    adminNote?: string
  ): Promise<{
    success: boolean;
    conversion: any;
    message: string;
  }>;

  rejectConversion(
    conversionId: string,
    adminId: string,
    reason: string
  ): Promise<{
    success: boolean;
    conversion: any;
    message: string;
  }>;

  getConversionStats(): Promise<{
    totalConversions: number;
    totalPointsConverted: number;
    totalCVCGenerated: number;
    totalClaimed: number;
    totalPending: number;
    dailyStats: any[];
  }>;

  getConversionById(conversionId: string): Promise<any>;

  updateConversionRate(
    adminId: string,
    rateData: {
      pointsPerCVC: number;
      minimumPoints: number;
      minimumCVC: number;
      claimFeeETH: string;
      effectiveFrom?: Date;
    }
  ): Promise<{
    success: boolean;
    rate: any;
    message: string;
  }>;

  getConversionRates(page?: number, limit?: number): Promise<{
    rates: any[];
    total: number;
    totalPages: number;
  }>;

  getCurrentRate(): Promise<any>;
}