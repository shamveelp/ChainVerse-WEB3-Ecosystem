import { injectable } from "inversify";
import { ICommunityRepository } from "../core/interfaces/repositories/ICommunityRepository";
import { IUser, UserModel } from "../models/user.models";
import { FollowModel } from "../models/follow.models";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";
import { Types } from "mongoose";
import {
  FollowListResponseDto,
  UserFollowInfo,
} from "../dtos/community/Follow.dto";

@injectable()
export class CommunityRepository implements ICommunityRepository {
  async findUserById(userId: string): Promise<IUser | null> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return null;
      }
      return await UserModel.findById(userId).select("-password").exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching user",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    try {
      return await UserModel.findOne({ username }).select("-password").exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching user by username",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateCommunityProfile(
    userId: string,
    data: Partial<IUser["community"]>
  ): Promise<IUser | null> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const updateData: any = {};
      Object.keys(data).forEach((key) => {
        updateData[`community.${key}`] = (data as any)[key];
      });

      return await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select("-password")
        .exec();
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating community profile",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async incrementPostsCount(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { "community.postsCount": 1 },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while incrementing posts count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async incrementLikesReceived(
    userId: string,
    count: number = 1
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { "community.likesReceived": count },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while incrementing likes received",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateFollowersCount(userId: string, count: number): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $set: { followersCount: count },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while updating followers count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateFollowingCount(userId: string, count: number): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $set: { followingCount: count },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while updating following count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Follow-related methods
  async createFollow(followerId: string, followingId: string): Promise<void> {
    try {
      if (
        !Types.ObjectId.isValid(followerId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new CustomError("Invalid user IDs", StatusCode.BAD_REQUEST);
      }

      const follow = new FollowModel({
        follower: new Types.ObjectId(followerId),
        following: new Types.ObjectId(followingId),
      });

      await follow.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new CustomError(
          "Already following this user",
          StatusCode.BAD_REQUEST
        );
      }
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while creating follow relationship",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async removeFollow(followerId: string, followingId: string): Promise<void> {
    try {
      if (
        !Types.ObjectId.isValid(followerId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new CustomError("Invalid user IDs", StatusCode.BAD_REQUEST);
      }

      const result = await FollowModel.findOneAndDelete({
        follower: new Types.ObjectId(followerId),
        following: new Types.ObjectId(followingId),
      }).exec();

      if (!result) {
        throw new CustomError(
          "Follow relationship not found",
          StatusCode.NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while removing follow relationship",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkIfFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(followerId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        return false;
      }

      const follow = await FollowModel.findOne({
        follower: new Types.ObjectId(followerId),
        following: new Types.ObjectId(followingId),
      }).exec();

      return !!follow;
    } catch (error) {
      console.error("Database error while checking follow status:", error);
      return false;
    }
  }

  async getFollowers(
    userId: string,
    viewerUserId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FollowListResponseDto> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const query: any = { following: new Types.ObjectId(userId) };

      // Add cursor-based pagination
      if (cursor) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const follows = await FollowModel.find(query)
        .populate({
          path: "follower",
          select:
            "_id username name profilePic community.bio community.isVerified",
        })
        .sort({ _id: -1 })
        .limit(limit + 1)
        .exec();

      const hasMore = follows.length > limit;
      const followersList = follows.slice(0, limit);

      // Check follow status for viewer
      const users: UserFollowInfo[] = [];
      for (const follow of followersList) {
        const follower = follow.follower as any;
        let isFollowing = false;

        if (viewerUserId && viewerUserId !== follower._id.toString()) {
          isFollowing = await this.checkIfFollowing(
            viewerUserId,
            follower._id.toString()
          );
        }

        users.push({
          _id: follower._id.toString(),
          username: follower.username,
          name: follower.name || "",
          profilePic: follower.profilePic || "",
          isVerified: follower.community?.isVerified || false,
          bio: follower.community?.bio || "",
          isFollowing,
          followedAt: follow.createdAt,
        });
      }

      // Get total count
      const totalCount = await FollowModel.countDocuments({
        following: new Types.ObjectId(userId),
      });

      return {
        users,
        hasMore,
        nextCursor: hasMore
          ? followersList[followersList.length - 1]._id!.toString()
          : undefined,
        totalCount,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting followers",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getFollowing(
    userId: string,
    viewerUserId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FollowListResponseDto> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const query: any = { follower: new Types.ObjectId(userId) };

      // Add cursor-based pagination
      if (cursor) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const follows = await FollowModel.find(query)
        .populate({
          path: "following",
          select:
            "_id username name profilePic community.bio community.isVerified",
        })
        .sort({ _id: -1 })
        .limit(limit + 1)
        .exec();

      const hasMore = follows.length > limit;
      const followingList = follows.slice(0, limit);

      // Check follow status for viewer
      const users: UserFollowInfo[] = [];
      for (const follow of followingList) {
        const following = follow.following as any;
        let isFollowing = false;

        if (viewerUserId && viewerUserId !== following._id.toString()) {
          isFollowing = await this.checkIfFollowing(
            viewerUserId,
            following._id.toString()
          );
        }

        users.push({
          _id: following._id.toString(),
          username: following.username,
          name: following.name || "",
          profilePic: following.profilePic || "",
          isVerified: following.community?.isVerified || false,
          bio: following.community?.bio || "",
          isFollowing,
          followedAt: follow.createdAt,
        });
      }

      // Get total count
      const totalCount = await FollowModel.countDocuments({
        follower: new Types.ObjectId(userId),
      });

      return {
        users,
        hasMore,
        nextCursor: hasMore
          ? followingList[followingList.length - 1]._id!.toString()
          : undefined,
        totalCount,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting following",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async incrementFollowersCount(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { followersCount: 1 },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while incrementing followers count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async decrementFollowersCount(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { followersCount: -1 },
        $max: { followersCount: 0 }, // Ensure count doesn't go below 0
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while decrementing followers count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async incrementFollowingCount(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { followingCount: 1 },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while incrementing following count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async decrementFollowingCount(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { followingCount: -1 },
        $max: { followingCount: 0 }, // Ensure count doesn't go below 0
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while decrementing following count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
