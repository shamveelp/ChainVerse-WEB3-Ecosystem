import { IDailyCheckIn } from "../../../models/dailyCheckIn.model";

export interface IDailyCheckInService {
  getCheckInHistory(userId: string, page: number, limit: number): Promise<{
    checkIns: IDailyCheckIn[];
    total: number;
    totalPages: number;
  }>;
}