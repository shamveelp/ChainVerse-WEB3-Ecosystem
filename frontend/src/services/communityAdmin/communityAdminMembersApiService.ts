import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

// Types
interface CommunityMember {
  member: any;
  _id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  isActive: boolean;
  lastActiveAt: Date;
  isPremium: boolean;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
  };
  bannedUntil?: Date;
  banReason?: string;
}

interface MemberFilters {
  cursor?: string;
  limit?: number;
  search?: string;
  role?: 'member' | 'moderator' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
  sortBy?: 'recent' | 'oldest' | 'most_active' | 'most_posts';
}

interface MembersListResponse {
  members: CommunityMember[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  summary: {
    totalMembers: number;
    activeMembers: number;
    moderators: number;
    premiumMembers: number;
    bannedMembers: number;
    newMembersThisWeek: number;
  };
}

interface UpdateMemberRoleData {
  memberId: string;
  role: 'member' | 'moderator';
  reason?: string;
}

interface BanMemberData {
  memberId: string;
  reason: string;
  durationDays?: number;
}

interface BulkUpdateData {
  memberIds: string[];
  action: 'ban' | 'unban' | 'remove' | 'promote_to_moderator' | 'demote_to_member';
  reason?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

class CommunityAdminMembersApiService {
  // private readonly baseUrl = '/api/community-admin/members';

  // Get community members
  async getCommunityMembers(filters: MemberFilters = {}): Promise<ApiResponse<MembersListResponse>> {
    try {
      const params = new URLSearchParams();
      if (filters.cursor) params.append('cursor', filters.cursor);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.MEMBERS}?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get community members error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get community members",
      };
    }
  }

  // Get member details
  async getMemberDetails(memberId: string): Promise<ApiResponse<CommunityMember>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.MEMBER_BY_ID(memberId));
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get member details error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get member details",
      };
    }
  }

  // Update member role
  async updateMemberRole(data: UpdateMemberRoleData): Promise<ApiResponse<{ member: CommunityMember }>> {
    try {
      const response = await api.put(COMMUNITY_ADMIN_API_ROUTES.MEMBER_ROLE, data);
      return {
        success: true,
        data: { member: response.data.member },
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Update member role error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to update member role",
      };
    }
  }

  // Ban member
  async banMember(data: BanMemberData): Promise<ApiResponse<{ member: CommunityMember }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.MEMBER_BAN_ACTION, data);
      return {
        success: true,
        data: { member: response.data.member },
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Ban member error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to ban member",
      };
    }
  }

  // Unban member
  async unbanMember(memberId: string): Promise<ApiResponse<{ member: CommunityMember }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.MEMBER_UNBAN(memberId));
      return {
        success: true,
        data: { member: response.data.member },
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Unban member error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to unban member",
      };
    }
  }

  // Remove member
  async removeMember(memberId: string, reason?: string): Promise<ApiResponse> {
    try {
      const response = await api.delete(COMMUNITY_ADMIN_API_ROUTES.MEMBER_BY_ID(memberId), {
        data: { reason }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Remove member error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to remove member",
      };
    }
  }

  // Get member activity
  async getMemberActivity(memberId: string, period: string = 'week'): Promise<ApiResponse> {
    try {
      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.MEMBER_ACTIVITY(memberId)}?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get member activity error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get member activity",
      };
    }
  }

  // Bulk update members
  async bulkUpdateMembers(data: BulkUpdateData): Promise<ApiResponse> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.MEMBERS_BULK_UPDATE, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Bulk update members error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to perform bulk action",
      };
    }
  }

  // Helper functions
  formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = (now.getTime() - targetDate.getTime()) / 1000;

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'member':
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  }

  getStatusColor(member: CommunityMember): string {
    if (member.bannedUntil && new Date(member.bannedUntil) > new Date()) {
      return 'text-red-400';
    }
    if (!member.isActive) {
      return 'text-gray-500';
    }

    const lastActive = new Date(member.lastActiveAt);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive <= 1) {
      return 'text-green-400';
    } else if (daysSinceActive <= 7) {
      return 'text-yellow-400';
    } else {
      return 'text-gray-400';
    }
  }
}

export const communityAdminMembersApiService = new CommunityAdminMembersApiService();
export default communityAdminMembersApiService;