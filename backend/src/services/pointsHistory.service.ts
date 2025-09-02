import { injectable, inject } from "inversify";
import { IPointsHistoryService } from "../core/interfaces/services/IPointsHistoryService";
import { IPointsHistoryRepository } from "../core/interfaces/repositories/IPointsHistoryRepository";
import { TYPES } from "../core/types/types";
import { IPointsHistory } from "../models/pointsHistory.model";

@injectable()
export class PointsHistoryService implements IPointsHistoryService {
  constructor(
    @inject(TYPES.IPointsHistoryRepository) private _pointsHistoryRepository: IPointsHistoryRepository
  ) {}

  async getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: IPointsHistory[];
    total: number;
    totalPages: number;
  }> {
    return await this._pointsHistoryRepository.getPointsHistory(userId, page, limit);
  }
}