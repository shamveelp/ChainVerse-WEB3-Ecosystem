import { injectable, inject } from "inversify";
import { IFollowService } from "../../core/interfaces/services/community/IFollowService";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { 
    FollowResponseDto, 
    FollowListResponseDto, 
    UserFollowInfo, 
    FollowStatsDto 
} from "../../dtos/community/Follow.dto";

@injectable()
export class FollowService implements IFollowService {
    constructor(
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async followUser(followerId: string, targetUsername: string): Promise<FollowResponseDto> {
        try {
            console.log("FollowService: Following user:", targetUsername, "by:", followerId);

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

            // Create follow relationship
            await this._communityRepository.createFollow(followerId, targetUser._id.toString());

            // Update follower and following counts
            await this._communityRepository.incrementFollowingCount(followerId);
            await this._communityRepository.incrementFollowersCount(targetUser._id.toString());

            // Get updated counts
            const followerUser = await this._communityRepository.findUserById(followerId);
            const updatedTargetUser = await this._communityRepository.findUserById(targetUser._id.toString());

            return {
                success: true,
                message: `You are now following @${targetUsername}`,
                isFollowing: true,
                followersCount: updatedTargetUser?.followersCount || 0,
                followingCount: followerUser?.followingCount || 0
            };
        } catch (error) {
            console.error("FollowService: Follow user error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to follow user", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unfollowUser(followerId: string, targetUsername: string): Promise<FollowResponseDto> {
        try {
            console.log("FollowService: Unfollowing user:", targetUsername, "by:", followerId);

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

            // Remove follow relationship
            await this._communityRepository.removeFollow(followerId, targetUser._id.toString());

            // Update follower and following counts
            await this._communityRepository.decrementFollowingCount(followerId);
            await this._communityRepository.decrementFollowersCount(targetUser._id.toString());

            // Get updated counts
            const followerUser = await this._communityRepository.findUserById(followerId);
            const updatedTargetUser = await this._communityRepository.findUserById(targetUser._id.toString());

            return {
                success: true,
                message: `You unfollowed @${targetUsername}`,
                isFollowing: false,
                followersCount: updatedTargetUser?.followersCount || 0,
                followingCount: followerUser?.followingCount || 0
            };
        } catch (error) {
            console.error("FollowService: Unfollow user error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to unfollow user", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowers(userId: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            console.log("FollowService: Getting followers for user:", userId);

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const result = await this._communityRepository.getFollowers(userId, viewerUserId, cursor, limit);
            return result;
        } catch (error) {
            console.error("FollowService: Get followers error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get followers", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowing(userId: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            console.log("FollowService: Getting following for user:", userId);

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const result = await this._communityRepository.getFollowing(userId, viewerUserId, cursor, limit);
            return result;
        } catch (error) {
            console.error("FollowService: Get following error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get following", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserFollowers(username: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            console.log("FollowService: Getting followers for username:", username);

            if (!username) {
                throw new CustomError("Username is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserByUsername(username);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            return await this.getFollowers(user._id.toString(), viewerUserId, cursor, limit);
        } catch (error) {
            console.error("FollowService: Get user followers error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get user followers", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserFollowing(username: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<FollowListResponseDto> {
        try {
            console.log("FollowService: Getting following for username:", username);

            if (!username) {
                throw new CustomError("Username is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserByUsername(username);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
            }

            return await this.getFollowing(user._id.toString(), viewerUserId, cursor, limit);
        } catch (error) {
            console.error("FollowService: Get user following error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get user following", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowStatus(viewerUserId: string, targetUsername: string): Promise<{ isFollowing: boolean }> {
        try {
            console.log("FollowService: Getting follow status for:", targetUsername, "by:", viewerUserId);

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
            console.error("FollowService: Get follow status error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get follow status", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getFollowStats(userId: string): Promise<FollowStatsDto> {
        try {
            console.log("FollowService: Getting follow stats for user:", userId);

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
            console.error("FollowService: Get follow stats error:", error);
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
            console.error("FollowService: Check if following error:", error);
            throw new CustomError("Failed to check follow status", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}