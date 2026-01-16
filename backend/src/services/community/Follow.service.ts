import { injectable, inject } from "inversify";
import { IFollowService } from "../../core/interfaces/services/community/IFollow.service";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import {
    FollowResponseDto,
    FollowListResponseDto,
    FollowStatsDto
} from "../../dtos/community/Follow.dto";

@injectable()
export class FollowService implements IFollowService {
    constructor(
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) { }

    async followUser(followerId: string, targetUsername: string): Promise<FollowResponseDto> {
        try {
            if (!followerId || !targetUsername) {
                throw new CustomError("Follower ID and target username are required", StatusCode.BAD_REQUEST);
            }

            // Get target user
            const targetUser = await this._communityRepository.findUserByUsername(targetUsername);
            if (!targetUser) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            // Check if trying to follow self
            if (targetUser._id.toString() === followerId) {
                throw new CustomError("You cannot follow yourself", StatusCode.BAD_REQUEST);
            }

            // Check if already following
            const isAlreadyFollowing = await this._communityRepository.checkIfFollowing(followerId, targetUser._id.toString());
            if (isAlreadyFollowing) {
                throw new CustomError("You are already following this user", StatusCode.BAD_REQUEST);
            }

            // Atomic transaction-like operation
            let followCreated = false;
            try {
                // Create follow relationship
                await this._communityRepository.createFollow(followerId, targetUser._id.toString());
                followCreated = true;

                // Update counts atomically
                await Promise.all([
                    this._communityRepository.incrementFollowingCount(followerId),
                    this._communityRepository.incrementFollowersCount(targetUser._id.toString())
                ]);

                // Get updated users for accurate counts
                const [followerUser, updatedTargetUser] = await Promise.all([
                    this._communityRepository.findUserById(followerId),
                    this._communityRepository.findUserById(targetUser._id.toString())
                ]);

                return {
                    success: true,
                    message: `You are now following @${targetUsername}`,
                    isFollowing: true,
                    followersCount: updatedTargetUser?.followersCount || 0,
                    followingCount: followerUser?.followingCount || 0
                };

            } catch (error) {
                // Rollback if follow was created but count update failed
                if (followCreated) {
                    try {
                        await this._communityRepository.removeFollow(followerId, targetUser._id.toString());
                        // Also rollback count changes if they were applied
                        await Promise.all([
                            this._communityRepository.decrementFollowingCount(followerId),
                            this._communityRepository.decrementFollowersCount(targetUser._id.toString())
                        ]);
                    } catch (rollbackError) {
                        // Ignore rollback error
                    }
                }
                throw error;
            }

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to follow user", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unfollowUser(followerId: string, targetUsername: string): Promise<FollowResponseDto> {
        try {
            if (!followerId || !targetUsername) {
                throw new CustomError("Follower ID and target username are required", StatusCode.BAD_REQUEST);
            }

            // Get target user
            const targetUser = await this._communityRepository.findUserByUsername(targetUsername);
            if (!targetUser) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            // Check if trying to unfollow self
            if (targetUser._id.toString() === followerId) {
                throw new CustomError("You cannot unfollow yourself", StatusCode.BAD_REQUEST);
            }

            // Check if following
            const isFollowing = await this._communityRepository.checkIfFollowing(followerId, targetUser._id.toString());
            if (!isFollowing) {
                throw new CustomError("You are not following this user", StatusCode.BAD_REQUEST);
            }

            // Atomic transaction-like operation
            let followRemoved = false;
            try {
                // Remove follow relationship
                await this._communityRepository.removeFollow(followerId, targetUser._id.toString());
                followRemoved = true;

                // Update counts atomically
                await Promise.all([
                    this._communityRepository.decrementFollowingCount(followerId),
                    this._communityRepository.decrementFollowersCount(targetUser._id.toString())
                ]);

                // Get updated users for accurate counts
                const [followerUser, updatedTargetUser] = await Promise.all([
                    this._communityRepository.findUserById(followerId),
                    this._communityRepository.findUserById(targetUser._id.toString())
                ]);

                return {
                    success: true,
                    message: `You unfollowed @${targetUsername}`,
                    isFollowing: false,
                    followersCount: updatedTargetUser?.followersCount || 0,
                    followingCount: followerUser?.followingCount || 0
                };

            } catch (error) {
                // Rollback if follow was removed but count update failed
                if (followRemoved) {
                    try {
                        await this._communityRepository.createFollow(followerId, targetUser._id.toString());
                        // Also rollback count changes if they were applied
                        await Promise.all([
                            this._communityRepository.incrementFollowingCount(followerId),
                            this._communityRepository.incrementFollowersCount(targetUser._id.toString())
                        ]);
                    } catch (rollbackError) {
                        // Ignore rollback error
                    }
                }
                throw error;
            }

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to unfollow user", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowers(userId: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            // Validate limit
            const validLimit = Math.min(Math.max(limit, 1), 50);

            const result = await this._communityRepository.getFollowers(userId, viewerUserId, cursor, validLimit);
            return result;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get followers", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowing(userId: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            // Validate limit
            const validLimit = Math.min(Math.max(limit, 1), 50);

            const result = await this._communityRepository.getFollowing(userId, viewerUserId, cursor, validLimit);
            return result;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get following", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserFollowers(username: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            if (!username) {
                throw new CustomError("Username is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserByUsername(username);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            return await this.getFollowers(user._id.toString(), viewerUserId, cursor, limit);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get user followers", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserFollowing(username: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            if (!username) {
                throw new CustomError("Username is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserByUsername(username);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            return await this.getFollowing(user._id.toString(), viewerUserId, cursor, limit);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get user following", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowStatus(viewerUserId: string, targetUsername: string): Promise<{ isFollowing: boolean }> {
        try {
            if (!viewerUserId || !targetUsername) {
                throw new CustomError("Viewer ID and target username are required", StatusCode.BAD_REQUEST);
            }

            const targetUser = await this._communityRepository.findUserByUsername(targetUsername);
            if (!targetUser) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            const isFollowing = await this._communityRepository.checkIfFollowing(viewerUserId, targetUser._id.toString());

            return { isFollowing };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get follow status", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowStats(userId: string): Promise<FollowStatsDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserById(userId);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            return {
                followersCount: user.followersCount || 0,
                followingCount: user.followingCount || 0
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get follow stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async checkIfFollowing(followerId: string, targetId: string): Promise<boolean> {
        try {
            return await this._communityRepository.checkIfFollowing(followerId, targetId);
        } catch (error) {
            return false; // Return false on error instead of throwing
        }
    }
}