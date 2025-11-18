import api from "@/lib/api-client";

// Types
interface Quest {
  _id: string;
  communityId: any;
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: 'fcfs' | 'random';
  participantLimit: number;
  rewardPool: {
    amount: number;
    currency: string;
    rewardType: 'token' | 'nft' | 'points' | 'custom';
    customReward?: string;
  };
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  totalParticipants: number;
  totalSubmissions: number;
  winnersSelected: boolean;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks?: QuestTask[];
  community?: {
    communityName: string;
    logo: string;
    username: string;
  };
  isParticipating?: boolean;
  participationStatus?: string;
  completedTasks?: number;
}

interface QuestTask {
  _id: string;
  questId: string;
  title: string;
  description: string;
  taskType: string;
  isRequired: boolean;
  order: number;
  config: any;
  completedBy: number;
  isCompleted?: boolean;
  submission?: any;
}

interface MyQuest {
  _id: string;
  questId: string;
  quest: Quest;
  status: string;
  joinedAt: Date;
  completedAt?: Date;
  totalTasksCompleted: number;
  isWinner: boolean;
  rewardClaimed: boolean;
  progress: number;
}

interface TaskSubmission {
  _id: string;
  questId: string;
  taskId: string;
  submissionData: {
    text?: string;
    imageUrl?: string;
    linkUrl?: string;
    twitterUrl?: string;
    walletAddress?: string;
    transactionHash?: string;
  };
  status: string;
  submittedAt: Date;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface PaginationResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    quests?: T[];
    items?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class UserQuestApiService {
  private readonly baseUrl = '/api/user';

  // Quest browsing
  async getAvailableQuests(params?: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'active' | 'ended';
    search?: string;
    communityId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    rewardType?: 'token' | 'nft' | 'points' | 'custom';
  }): Promise<PaginationResponse<Quest>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.communityId) queryParams.append('communityId', params.communityId);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.rewardType) queryParams.append('rewardType', params.rewardType);

      const response = await api.get(`${this.baseUrl}/quests?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get available quests error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get quests",
      };
    }
  }

  async getQuest(questId: string): Promise<ApiResponse<Quest>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get quest",
      };
    }
  }

  async getTopQuests(limit?: number): Promise<ApiResponse<Quest[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());

      const response = await api.get(`${this.baseUrl}/quests/top?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get top quests error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get top quests",
      };
    }
  }

  // My quests
  async getMyQuests(params?: {
    page?: number;
    limit?: number;
    status?: 'registered' | 'in_progress' | 'completed' | 'winner' | 'disqualified';
    search?: string;
  }): Promise<PaginationResponse<MyQuest>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await api.get(`${this.baseUrl}/quests/my?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get my quests error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get my quests",
      };
    }
  }

  // Quest participation
  async joinQuest(questId: string, walletAddress?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await api.post(`${this.baseUrl}/quests/join`, {
        questId,
        walletAddress
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Join quest error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to join quest",
      };
    }
  }

  async checkParticipationStatus(questId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}/participation-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Check participation status error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to check participation status",
      };
    }
  }

  // Quest tasks
  async getQuestTasks(questId: string): Promise<ApiResponse<QuestTask[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}/tasks`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest tasks error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get quest tasks",
      };
    }
  }

  async submitTask(questId: string, taskId: string, submissionData: {
    text?: string;
    imageUrl?: string;
    linkUrl?: string;
    twitterUrl?: string;
    walletAddress?: string;
    transactionHash?: string;
  }): Promise<ApiResponse<TaskSubmission>> {
    try {
      const response = await api.post(`${this.baseUrl}/quests/submit-task`, {
        questId,
        taskId,
        submissionData
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Submit task error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to submit task",
      };
    }
  }

  async getMySubmissions(questId: string): Promise<ApiResponse<TaskSubmission[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}/submissions`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get my submissions error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get submissions",
      };
    }
  }

  // File upload
  async uploadTaskMedia(file: File): Promise<ApiResponse<{ mediaUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await api.post(`${this.baseUrl}/quests/upload-media`, formData, {
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
      console.error("Upload task media error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to upload media",
      };
    }
  }

  // Quest stats and leaderboard
  async getQuestStats(questId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}/stats`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get quest stats",
      };
    }
  }

  async getQuestLeaderboard(questId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/quests/${questId}/leaderboard`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get quest leaderboard error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to get quest leaderboard",
      };
    }
  }
}

export const userQuestApiService = new UserQuestApiService();
export default userQuestApiService;