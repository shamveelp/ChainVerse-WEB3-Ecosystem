import {
  ConversionResponseDto,
  ConversionRateResponseDto
} from "../../../../dtos/points/PointsConversion.dto";

export interface IAdminPointsConversionService {
  getAllConversions(page?: number, limit?: number, status?: string): Promise<{
    conversions: ConversionResponseDto[];
    total: number;
    totalPages: number;
  }>;

  approveConversion(
    conversionId: string,
    adminId: string,
    adminNote?: string
  ): Promise<{
    success: boolean;
    conversion: Partial<ConversionResponseDto>;
    message: string;
  }>;

  rejectConversion(
    conversionId: string,
    adminId: string,
    reason: string
  ): Promise<{
    success: boolean;
    conversion: Partial<ConversionResponseDto>;
    message: string;
  }>;

  getConversionStats(): Promise<{
    totalConversions: number;
    totalPointsConverted: number;
    totalCVCGenerated: number;
    totalClaimed: number;
    totalPending: number;
    dailyStats: Array<{ date: string; count: number; amount: number }>;
  }>;

  getConversionById(conversionId: string): Promise<ConversionResponseDto>;

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
    rate: ConversionRateResponseDto;
    message: string;
  }>;

  getConversionRates(page?: number, limit?: number): Promise<{
    rates: ConversionRateResponseDto[];
    total: number;
    totalPages: number;
  }>;

  getCurrentRate(): Promise<ConversionRateResponseDto | null>;
}