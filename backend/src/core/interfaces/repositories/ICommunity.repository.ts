import { IUser } from "../../../models/user.models";
import { FollowListResponseDto } from "../../../dtos/community/Follow.dto";
import { ICommunity } from "../../../models/community.model";
import { ICommunityMember } from "../../../models/communityMember.model";

export interface ICommunityRepository {
    findUserById(userId: string): Promise<IUser | null>;
    findUserByUsername(username: string): Promise<IUser | null>;
    updateCommunityProfile(userId: string, data: Partial<IUser['community']>): Promise<IUser | null>;
    incrementPostsCount(userId: string): Promise<void>;
    incrementLikesReceived(userId: string, count: number): Promise<void>;
    updateFollowersCount(userId: string, count: number): Promise<void>;
    updateFollowingCount(userId: string, count: number): Promise<void>;
    
    // Follow-related methods
    createFollow(followerId: string, followingId: string): Promise<void>;
    removeFollow(followerId: string, followingId: string): Promise<void>;
    checkIfFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowers(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    getFollowing(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    incrementFollowersCount(userId: string): Promise<void>;
    decrementFollowersCount(userId: string): Promise<void>;
    incrementFollowingCount(userId: string): Promise<void>;
    decrementFollowingCount(userId: string): Promise<void>;

    // Community-related methods
    findCommunityById(communityId: string): Promise<ICommunity | null>;
    findCommunityByUsername(username: string): Promise<ICommunity | null>;
    searchCommunities(query: string, cursor?: string, limit?: number): Promise<{
        communities: ICommunity[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;
    
    // Search Users Method
    searchUsers(query: string, cursor?: string, limit?: number): Promise<{
        users: IUser[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;
    
    getPopularCommunities(cursor?: string, limit?: number, category?: string): Promise<{
        communities: ICommunity[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;
    getCommunityMemberCount(communityId: string): Promise<number>;
    checkCommunityMembership(userId: string, communityId: string): Promise<{
        isMember: boolean;
        role?: string;
        joinedAt?: Date;
    }>;
    addCommunityMember(userId: string, communityId: string): Promise<void>;
    removeCommunityMember(userId: string, communityId: string): Promise<void>;
    getCommunityMembers(communityId: string, cursor?: string, limit?: number): Promise<{
        members: ICommunityMember[];
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;

    // NEW: My Communities methods
    getUserCommunities(userId: string, filter: string, sortBy: string, cursor?: string, limit?: number): Promise<{
        memberships: Array<{
            community: ICommunity;
            role: string;
            joinedAt: Date;
            lastActiveAt: Date;
            unreadPosts: number;
            totalPosts: number;
            isActive: boolean;
            notifications: boolean;
            memberCount: number;
        }>;
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
    }>;

    getUserCommunityStats(userId: string): Promise<{
        total: number;
        admin: number;
        moderator: number;
        member: number;
    }>;

    getUserCommunitiesActivity(userId: string): Promise<{
        communities: Array<{
            community: ICommunity;
            lastActiveAt: Date;
            unreadPosts: number;
            recentActivity: string;
        }>;
        totalUnreadPosts: number;
        mostActiveToday: string[];
    }>;

    updateMemberNotifications(userId: string, communityId: string, enabled: boolean): Promise<boolean>;

    findById(communityId: string): Promise<ICommunity | null>;

    updateCommunity(communityId: string, updateData: Partial<ICommunity>): Promise<ICommunity | null>;
}