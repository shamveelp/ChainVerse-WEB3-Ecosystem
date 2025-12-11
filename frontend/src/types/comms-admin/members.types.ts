export interface CommunityMember {
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

export interface MemberFilters {
    cursor?: string;
    limit?: number;
    search?: string;
    role?: 'member' | 'moderator' | 'admin';
    status?: 'active' | 'inactive' | 'banned';
    sortBy?: 'recent' | 'oldest' | 'most_active' | 'most_posts';
}

export interface MembersListResponse {
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

export interface UpdateMemberRoleData {
    memberId: string;
    role: 'member' | 'moderator';
    reason?: string;
}

export interface BanMemberData {
    memberId: string;
    reason: string;
    durationDays?: number;
}

export interface BulkUpdateData {
    memberIds: string[];
    action: 'ban' | 'unban' | 'remove' | 'promote_to_moderator' | 'demote_to_member';
    reason?: string;
}
