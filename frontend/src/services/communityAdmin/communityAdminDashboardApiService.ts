import api from "@/lib/api-client";

// Types
interface CommunityOverview {
  _id: string;
  name: string;
  username: string;
  description: string;
  category: string;
  logo: string;
  banner: string;
  memberCount: number;
  activeMembers: number;
  isVerified: boolean;
  settings: {
    allowChainCast: boolean;
    allowGroupChat: boolean;
    allowPosts: boolean;
    allowQuests: boolean;
  };
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
}

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  newMembersToday: number;
  newMembersThisWeek: number;
  totalPosts: number;
  postsToday: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: number;
  growthRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  user: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
  };
  action: string;
  timestamp: Date;
}

interface TopMember {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  questsCompleted: number;
  joinedAt: Date;
  role: string;
  isPremium: boolean;
}

interface DashboardData {
  communityOverview: CommunityOverview;
  stats: CommunityStats;
  recentActivity: RecentActivity[];
  topMembers: TopMember[];
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

class CommunityAdminDashboardApiService {
  private readonly baseUrl = '/api/community-admin';

  // Get complete dashboard data
  async getDashboardData(period: string = 'week'): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get dashboard data error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
               error.response?.data?.message ||
               error.message ||
               "Failed to get dashboard data",
      };
    }
  }

  // Get community overview
  async getCommunityOverview(): Promise<ApiResponse<CommunityOverview>> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard/overview`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get community overview error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
               error.response?.data?.message ||
               error.message ||
               "Failed to get community overview",
      };
    }
  }

  // Get community stats
  async getCommunityStats(period: string = 'week'): Promise<ApiResponse<CommunityStats>> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard/stats?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get community stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
               error.response?.data?.message ||
               error.message ||
               "Failed to get community stats",
      };
    }
  }
}

export const communityAdminDashboardApiService = new CommunityAdminDashboardApiService();
export default communityAdminDashboardApiService;
