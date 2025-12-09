import { injectable, inject } from "inversify";
import { IPointsHistoryService } from "../core/interfaces/services/IPointsHistory.service";
import { IPointsHistoryRepository } from "../core/interfaces/repositories/IPointsHistory.repository";
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