import api from "@/lib/axios";
import { ADMIN_API_ROUTES } from "../../routes/api.routes";

export interface DashboardStats {
    usersCount: number;
    walletsCount: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; data: DashboardStats }>(ADMIN_API_ROUTES.DASHBOARD_STATS);
    return response.data.data;
};
