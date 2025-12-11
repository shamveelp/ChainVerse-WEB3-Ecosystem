import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES, USER_API_ROUTES } from "../../routes/api.routes";

// Types
import {
  Quest,
  QuestTask,
  QuestStats,
  Participant,
  CreateQuestData,
  AIQuestGenerationData,
  PaginationResponse
} from "@/types/comms-admin/quests.types";
import { ApiResponse } from "@/types/common.types";

class CommunityAdminQuestApiService {
  // private readonly baseUrl = '/api/community-admin';

  // Quest CRUD operations
  async createQuest(questData: CreateQuestData): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.CREATE, questData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Create quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create quest",
      };
    }
  }

  async getQuest(questId: string): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.QUESTS.BY_ID(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get quest",
      };
    }
  }

  async getQuests(params?: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'active' | 'ended' | 'cancelled';
    search?: string;
  }): Promise<PaginationResponse<Quest>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.QUESTS.BASE}?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quests error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get quests",
      };
    }
  }

  async updateQuest(questId: string, questData: Partial<CreateQuestData>): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.put(COMMUNITY_ADMIN_API_ROUTES.QUESTS.BY_ID(questId), questData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Update quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to update quest",
      };
    }
  }

  async deleteQuest(questId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await api.delete(COMMUNITY_ADMIN_API_ROUTES.QUESTS.BY_ID(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Delete quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to delete quest",
      };
    }
  }

  // AI Quest Generation
  async generateQuestWithAI(aiData: AIQuestGenerationData): Promise<ApiResponse<CreateQuestData>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.GENERATE_AI, aiData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Generate AI quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to generate quest with AI",
      };
    }
  }

  // Quest Status Management
  async startQuest(questId: string): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.START(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Start quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to start quest",
      };
    }
  }

  async endQuest(questId: string): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.END(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("End quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to end quest",
      };
    }
  }

  // Participants Management
  async getQuestParticipants(
    questId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginationResponse<Participant>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.QUESTS.PARTICIPANTS(questId)}?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get participants error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get participants",
      };
    }
  }

  async getParticipantDetails(questId: string, participantId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.QUESTS.PARTICIPANT_DETAILS(questId, participantId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get participant details error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get participant details",
      };
    }
  }

  async selectWinners(questId: string, method?: 'fcfs' | 'random' | 'leaderboard'): Promise<ApiResponse<{ winners: any[]; message: string }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.SELECT_WINNERS, {
        questId,
        method
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Select winners error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to select winners",
      };
    }
  }

  async selectReplacementWinners(questId: string, count: number = 1): Promise<ApiResponse<{ winners: any[]; message: string }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.SELECT_REPLACEMENT(questId), {
        count
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Select replacement winners error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to select replacement winners",
      };
    }
  }

  async disqualifyParticipant(questId: string, participantId: string, reason: string): Promise<ApiResponse<{ disqualified: boolean }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.DISQUALIFY(questId, participantId), {
        reason
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Disqualify participant error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to disqualify participant",
      };
    }
  }

  // Reward Distribution
  async distributeRewards(questId: string): Promise<ApiResponse<{ success: boolean; message: string; winnersRewarded: number }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.DISTRIBUTE_REWARDS(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Distribute rewards error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to distribute rewards",
      };
    }
  }

  // Analytics and Stats
  async getQuestStats(questId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.QUESTS.STATS(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get quest stats",
      };
    }
  }

  async getCommunityQuestStats(): Promise<ApiResponse<QuestStats>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.QUESTS.COMMUNITY_STATS);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get community quest stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get community quest stats",
      };
    }
  }

  async getQuestLeaderboard(questId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.QUESTS.LEADERBOARD(questId));
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest leaderboard error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to get quest leaderboard",
      };
    }
  }

  // File Upload
  async uploadQuestBanner(questId: string, file: File): Promise<ApiResponse<{ bannerUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.UPLOAD_BANNER(questId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Upload quest banner error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to upload quest banner",
      };
    }
  }

  // Search Communities
  async searchCommunities(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${USER_API_ROUTES.COMMUNITIES.SEARCH}?query=${encodeURIComponent(query)}&type=communities`);
      return {
        success: true,
        data: response.data.data?.communities || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Search communities error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to search communities",
      };
    }
  }

  // Search Users
  async searchUsers(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${USER_API_ROUTES.COMMUNITIES.SEARCH}?query=${encodeURIComponent(query)}&type=users`);
      return {
        success: true,
        data: response.data.data?.users || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Search users error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to search users",
      };
    }
  }

  // Chat with AI
  async chatWithAI(message: string, conversationHistory?: any[]): Promise<ApiResponse<{
    response: string;
    questGenerated?: boolean;
    questData?: CreateQuestData;
    needsInput?: {
      type: 'community' | 'user' | 'token' | 'nft';
      field: string;
      prompt: string;
    }[];
  }>> {
    try {
      const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.QUESTS.AI_CHAT, {
        message,
        history: conversationHistory || []
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("AI chat error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to chat with AI",
      };
    }
  }
}

export const communityAdminQuestApiService = new CommunityAdminQuestApiService();
export default communityAdminQuestApiService;