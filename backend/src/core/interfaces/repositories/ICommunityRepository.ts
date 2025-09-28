import { IUser } from "../../../models/user.models";

export interface ICommunityRepository {
    findUserById(userId: string): Promise<IUser | null>;
    findUserByUsername(username: string): Promise<IUser | null>;
    updateCommunityProfile(userId: string, data: Partial<IUser['community']>): Promise<IUser | null>;
    incrementPostsCount(userId: string): Promise<void>;
    incrementLikesReceived(userId: string, count: number): Promise<void>;
    updateFollowersCount(userId: string, count: number): Promise<void>;
    updateFollowingCount(userId: string, count: number): Promise<void>;
}