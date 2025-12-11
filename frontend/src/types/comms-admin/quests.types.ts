export interface Quest {
    _id: string;
    communityId: string;
    title: string;
    description: string;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    selectionMethod: 'fcfs' | 'random' | 'leaderboard';
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
    rewardsDistributed: boolean;
    isAIGenerated?: boolean;
    createdAt: Date;
    updatedAt: Date;
    tasks?: QuestTask[];
}

export interface QuestTask {
    _id: string;
    questId: string;
    title: string;
    description: string;
    taskType: string;
    isRequired: boolean;
    order: number;
    privilegePoints: number;
    config: any;
    completedBy: number;
}

export interface QuestStats {
    totalQuests: number;
    activeQuests: number;
    endedQuests: number;
    totalParticipants: number;
    totalRewardsDistributed: number;
    averageParticipants?: number;
    completionRate?: number;
}

export interface Participant {
    _id: string;
    questId: string;
    userId: any;
    walletAddress?: string;
    status: string;
    joinedAt: Date;
    completedAt?: Date;
    totalTasksCompleted: number;
    totalPrivilegePoints: number;
    isWinner: boolean;
    rewardClaimed: boolean;
}

export interface CreateQuestData {
    title: string;
    description: string;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    selectionMethod: 'fcfs' | 'random' | 'leaderboard';
    participantLimit: number;
    rewardPool: {
        amount: number;
        currency: string;
        rewardType: 'token' | 'nft' | 'points' | 'custom';
        customReward?: string;
    };
    tasks: Array<{
        title: string;
        description: string;
        taskType: string;
        isRequired: boolean;
        order: number;
        privilegePoints?: number;
        config?: any;
    }>;
    isAIGenerated?: boolean;
    aiPrompt?: string;
}

export interface AIQuestGenerationData {
    prompt: string;
    communityTheme?: string;
    targetAudience?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    expectedWinners?: number;
}

export interface PaginationResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        items?: T[];
        quests?: Quest[];
        participants?: Participant[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}
