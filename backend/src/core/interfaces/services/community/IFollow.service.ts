import { FollowResponseDto, FollowListResponseDto, UserFollowInfo, FollowStatsDto } from "../../../../dtos/community/Follow.dto";

export interface IFollowService {
    followUser(followerId: string, targetUsername: string): Promise<FollowResponseDto>;
    unfollowUser(followerId: string, targetUsername: string): Promise<FollowResponseDto>;
    getFollowers(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    getFollowing(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    getUserFollowers(username: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    getUserFollowing(username: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<FollowListResponseDto>;
    getFollowStatus(viewerUserId: string, targetUsername: string): Promise<{ isFollowing: boolean }>;
    getFollowStats(userId: string): Promise<FollowStatsDto>;
    checkIfFollowing(followerId: string, targetId: string): Promise<boolean>;
}