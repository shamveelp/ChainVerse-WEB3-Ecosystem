import { IPointsHistory } from "../../../models/pointsHistory.model";

export interface IPointsHistoryRepository {
  createPointsHistory(data: {
    userId: string;
    type: 'daily_checkin' | 'referral_bonus' | 'quest_reward' | 'bonus' | 'deduction' | 'conversion_deduction' | 'conversion_refund';
    points: number;
    description: string;
    relatedId?: string;
  }): Promise<IPointsHistory>;

  getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: IPointsHistory[];
    total: number;
    totalPages: number;
  }>;

  getTotalPointsByType(userId: string, type: string): Promise<number>;
}