import { IAdmin } from '../../../models/admin.model';
import { IDailyCheckIn } from "../../../models/dailyCheckIn.model";

export interface IAdminRepository {
    findByEmail(email: string): Promise<IAdmin | null>;
    findById(id: string): Promise<IAdmin | null>;
    updateById(id: string, update: Partial<IAdmin>): Promise<IAdmin | null>;
    incrementTokenVersion(id: string): Promise<void>;



  getCheckInHistory(userId: string, page: number, limit: number): Promise<{
    checkIns: IDailyCheckIn[];
    total: number;
    totalPages: number;
  }>;

}



