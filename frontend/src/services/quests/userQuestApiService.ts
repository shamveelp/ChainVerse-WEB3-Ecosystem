import api from "@/lib/api-client";
import { USER_API_ROUTES } from "../../routes/api.routes";

// Types
import { ApiResponse } from "@/types/common.types";
import {
  Quest,
  QuestTask,
  MyQuest,
  TaskSubmission,
  LeaderboardParticipant,
  PaginationResponse
} from "@/types/quests/user.types";

class UserQuestApiService {
  // private readonly baseUrl = '/api/user';

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

      const response = await api.get(`${USER_API_ROUTES.QUESTS.BASE}?${queryParams.toString()}`);
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
      const response = await api.get(USER_API_ROUTES.QUESTS.BY_ID(questId));
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

      const response = await api.get(`${USER_API_ROUTES.QUESTS.TOP}?${queryParams.toString()}`);
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

      const response = await api.get(`${USER_API_ROUTES.QUESTS.MY}?${queryParams.toString()}`);
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
      const response = await api.post(USER_API_ROUTES.QUESTS.JOIN, {
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
      const response = await api.get(USER_API_ROUTES.QUESTS.PARTICIPATION_STATUS(questId));
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
      const response = await api.get(USER_API_ROUTES.QUESTS.TASKS(questId));
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
    communityId?: string;
    targetUserId?: string;
  }): Promise<ApiResponse<TaskSubmission>> {
    try {
      const response = await api.post(USER_API_ROUTES.QUESTS.SUBMIT_TASK, {
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
      const response = await api.get(USER_API_ROUTES.QUESTS.MY_SUBMISSIONS(questId));
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

      const response = await api.post(USER_API_ROUTES.QUESTS.UPLOAD_MEDIA, formData, {
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
      const response = await api.get(USER_API_ROUTES.QUESTS.STATS(questId));
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

  async getQuestLeaderboard(questId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResponse<LeaderboardParticipant>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get(`${USER_API_ROUTES.QUESTS.LEADERBOARD(questId)}?${queryParams.toString()}`);
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

  // Enhanced task type validation
  validateTaskSubmissionData(taskType: string, submissionData: any): { valid: boolean; message?: string } {
    switch (taskType) {
      case 'join_community':
        if (!submissionData.communityId) {
          return { valid: false, message: "Please select a community to join" };
        }
        break;
      case 'follow_user':
        if (!submissionData.targetUserId) {
          return { valid: false, message: "Please select a user to follow" };
        }
        break;
      case 'twitter_post':
        if (!submissionData.twitterUrl) {
          return { valid: false, message: "Twitter post URL is required" };
        }
        const twitterUrlPattern = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
        if (!twitterUrlPattern.test(submissionData.twitterUrl)) {
          return { valid: false, message: "Please provide a valid Twitter post URL" };
        }
        break;
      case 'upload_screenshot':
        if (!submissionData.imageUrl) {
          return { valid: false, message: "Screenshot is required" };
        }
        break;
      case 'wallet_connect':
        if (!submissionData.walletAddress) {
          return { valid: false, message: "Wallet address is required" };
        }
        const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
        if (!ethAddressPattern.test(submissionData.walletAddress)) {
          return { valid: false, message: "Please provide a valid Ethereum wallet address" };
        }
        break;
      case 'custom':
        if (!submissionData.text && !submissionData.linkUrl && !submissionData.imageUrl) {
          return { valid: false, message: "Please provide some form of submission" };
        }
        break;
    }
    return { valid: true };
  }

  // Get task type instructions for UI
  getTaskTypeInstructions(taskType: string, config: any): string {
    switch (taskType) {
      case 'join_community':
        return config.communityName
          ? `Join the "${config.communityName}" community`
          : "Join the specified community";
      case 'follow_user':
        return config.targetUsername
          ? `Follow @${config.targetUsername}`
          : "Follow the specified user";
      case 'twitter_post':
        return "Post the specified content on Twitter and provide the post URL";
      case 'upload_screenshot':
        return config.websiteUrl
          ? `Take a screenshot of ${config.websiteUrl} and upload it`
          : "Upload a screenshot as proof of completion";
      case 'wallet_connect':
        return "Connect your wallet and provide your wallet address";
      case 'custom':
        return config.customInstructions || "Follow the task instructions";
      default:
        return "Complete the task as instructed";
    }
  }

  // Get required fields for task type
  getRequiredFields(taskType: string): string[] {
    switch (taskType) {
      case 'join_community':
        return ['communityId'];
      case 'follow_user':
        return ['targetUserId'];
      case 'twitter_post':
        return ['twitterUrl'];
      case 'upload_screenshot':
        return ['imageUrl'];
      case 'wallet_connect':
        return ['walletAddress'];
      case 'custom':
        return []; // Can be text, link, or image
      default:
        return [];
    }
  }
}

export const userQuestApiService = new UserQuestApiService();
export default userQuestApiService;