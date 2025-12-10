export interface IAdminDashboardService {
    getDashboardStats(): Promise<{
        usersCount: number;
        walletsCount: number;
    }>;
}
