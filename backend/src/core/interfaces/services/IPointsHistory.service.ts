import { IPointsHistory } from "../../../models/pointsHistory.model";

export interface IPointsHistoryService {
  getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: IPointsHistory[];
    total: number;
    totalPages: number;
  }>;
}