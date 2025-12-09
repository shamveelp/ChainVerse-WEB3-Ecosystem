import { IConversionRate } from "../../../../models/conversionRate.model";

export interface IConversionRateRepository {
  create(data: {
    pointsPerCVC: number;
    minimumPoints: number;
    minimumCVC: number;
    claimFeeETH: string;
    isActive: boolean;
    effectiveFrom: Date;
    createdBy: string;
  }): Promise<IConversionRate>;

  findById(id: string): Promise<IConversionRate | null>;

  getCurrentRate(): Promise<IConversionRate | null>;

  findAll(page?: number, limit?: number): Promise<{
    rates: IConversionRate[];
    total: number;
    totalPages: number;
  }>;

  updateRate(
    id: string,
    updates: Partial<IConversionRate>
  ): Promise<IConversionRate | null>;

  deactivateAllRates(): Promise<void>;
}