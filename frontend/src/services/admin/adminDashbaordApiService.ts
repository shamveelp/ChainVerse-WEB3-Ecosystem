import api from "@/lib/axios";

export interface DashboardStats {
    usersCount: number;
    walletsCount: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; data: DashboardStats }>("/api/admin/dashboard/stats");
    return response.data.data;
};
