import { injectable, inject } from "inversify";
import { IDailyCheckInService } from "../core/interfaces/services/IDailyCheckInService";
import { TYPES } from "../core/types/types";
import { IDailyCheckIn } from "../models/dailyCheckIn.model";
import { IDailyCheckInRepository } from "../core/interfaces/repositories/IDailyCheckInRepository";
import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";

@injectable()
export class DailyCheckInService implements IDailyCheckInService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository
  ) {}

  async getCheckInHistory(userId: string, page: number, limit: number): Promise<{
    checkIns: IDailyCheckIn[];
    total: number;
    totalPages: number;
  }> {
    return await this._adminRepository.getCheckInHistory(userId, page, limit);
  }
}