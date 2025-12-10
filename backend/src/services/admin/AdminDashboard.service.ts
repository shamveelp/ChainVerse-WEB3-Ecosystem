import { injectable, inject } from "inversify";
import { IAdminDashboardService } from "../../core/interfaces/services/admin/IAdminDashboard.service";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import { IDexRepository } from "../../core/interfaces/repositories/IDex.repository";
import { TYPES } from "../../core/types/types";

@injectable()
export class AdminDashboardService implements IAdminDashboardService {
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
    ) { }

    /**
     * Retrieves dashboard statistics including user count and wallet count.
     * @returns {Promise<{ usersCount: number; walletsCount: number; }>} Dashboard stats.
     */
    async getDashboardStats(): Promise<{
        usersCount: number;
        walletsCount: number;
    }> {
        const usersCount = await this._userRepository.count();
        const walletStats = await this._dexRepository.getWalletStats();

        return {
            usersCount,
            walletsCount: walletStats.totalWallets
        };
    }
}
