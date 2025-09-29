import { IUser } from "../../../models/user.models";
import { FollowListResponseDto } from "../../../dtos/community/Follow.dto";

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
}