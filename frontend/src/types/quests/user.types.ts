export interface QuestTask {
    _id: string;
    questId: string;
    title: string;
    description: string;
    taskType: string;
    isRequired: boolean;
    order: number;
    privilegePoints?: number;
    config: any;
    completedBy: number;
    isCompleted?: boolean;
    submission?: any;
    canSubmit?: boolean;
}

export interface Quest {
    _id: string;
    communityId: any;
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
    canJoin?: boolean;
    joinMessage?: string;
    timeRemaining?: {
        days: number;
        hours: number;
        minutes: number;
        hasEnded: boolean;
    };
}

export interface MyQuest {
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

export interface TaskSubmission {
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
        communityId?: string;
        targetUserId?: string;
    };
    status: string;
    submittedAt: Date;
}

export interface LeaderboardParticipant {
    _id: string;
    userId: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
    };
    rank: number;
    totalTasksCompleted: number;
    totalPrivilegePoints: number;
    completedAt?: Date;
    joinedAt: Date;
    isWinner: boolean;
    rewardClaimed?: boolean;
}

export interface PaginationResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        quests?: T[];
        items?: T[];
        participants?: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}
