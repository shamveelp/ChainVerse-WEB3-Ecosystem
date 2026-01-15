import { ConversionResponseDto } from "../../../../dtos/points/PointsConversion.dto";

export interface IPointsConversionService {
  createConversion(userId: string, pointsToConvert: number): Promise<{
    success: boolean;
    conversionId: string;
    cvcAmount: number;
    message: string;
  }>;

  getUserConversions(userId: string, page?: number, limit?: number): Promise<{
    conversions: ConversionResponseDto[];
    total: number;
    totalPages: number;
    stats: {
      totalPointsConverted: number;
      totalCVCClaimed: number;
      pendingConversions: number;
    };
  }>;

  claimCVC(
    conversionId: string,
    userId: string,
    walletAddress: string,
    transactionHash: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  getCurrentConversionRate(): Promise<{
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    isActive: boolean;
    companyWallet: string;
    cvcContractAddress: string;
    network: string;
  }>;

  validateConversion(userId: string, pointsToConvert: number): Promise<{
    isValid: boolean;
    error?: string;
    cvcAmount?: number;
    userPoints?: number;
  }>;
}