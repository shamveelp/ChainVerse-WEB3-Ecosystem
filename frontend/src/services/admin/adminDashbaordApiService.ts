import { AxiosError } from 'axios';
import api from "@/lib/axios";
import { ADMIN_API_ROUTES } from "../../routes/api.routes";
import { DashboardStats } from "@/types/admin/dashboard.types";

interface ApiErrorData {
    error?: string;
    message?: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await api.get<{ success: boolean; data: DashboardStats }>(ADMIN_API_ROUTES.DASHBOARD_STATS);
        return response.data.data;
    } catch (error) {
        const axiosError = error as AxiosError<ApiErrorData>;
        console.error("Get dashboard stats error:", axiosError.response?.data || axiosError.message);
        throw axiosError;
    }
};
