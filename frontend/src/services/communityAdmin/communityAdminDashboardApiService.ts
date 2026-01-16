import { AxiosError } from 'axios';
import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

// Types
import { ApiResponse } from "@/types/common.types";
import {
  CommunityOverview,
  CommunityStats,
  RecentActivity,
  TopMember,
  DashboardData
} from "@/types/comms-admin/dashboard.types";

class CommunityAdminDashboardApiService {
  // private readonly baseUrl = '/api/community-admin';

  // Get complete dashboard data
  async getDashboardData(period: string = 'week'): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.DASHBOARD}?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Get dashboard data error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
          "Failed to get dashboard data",
      };
    }
  }

  // Get community overview
  async getCommunityOverview(): Promise<ApiResponse<CommunityOverview>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.DASHBOARD_OVERVIEW);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Get community overview error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
          "Failed to get community overview",
      };
    }
  }

  // Get community stats
  async getCommunityStats(period: string = 'week'): Promise<ApiResponse<CommunityStats>> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.DASHBOARD_STATS}?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Get community stats error:", ((error as AxiosError).response?.data) || ((error as AxiosError).message));
      return {
        success: false,
        error: ((error as AxiosError).response?.data)?.error ||
          ((error as AxiosError).response?.data)?.message ||
          ((error as AxiosError).message) ||
          "Failed to get community stats",
      };
    }
  }
}

export const communityAdminDashboardApiService = new CommunityAdminDashboardApiService();
export default communityAdminDashboardApiService;
