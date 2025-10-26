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
import CommunityModel, { ICommunity } from "../models/community.model";
import CommunityMemberModel, { ICommunityMember } from "../models/communityMember.model";

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
      if (!username || typeof username !== 'string') {
        return null;
      }
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
        $set: { followersCount: Math.max(0, count) },
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
        $set: { followingCount: Math.max(0, count) },
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while updating following count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Follow-related methods with improved atomic operations
  async createFollow(followerId: string, followingId: string): Promise<void> {
    try {
      if (
        !Types.ObjectId.isValid(followerId) ||
        !Types.ObjectId.isValid(followingId)
      ) {
        throw new CustomError("Invalid user IDs", StatusCode.BAD_REQUEST);
      }

      if (followerId === followingId) {
        throw new CustomError("Cannot follow yourself", StatusCode.BAD_REQUEST);
      }

      // Check if both users exist
      const [followerExists, followingExists] = await Promise.all([
        UserModel.exists({ _id: followerId }),
        UserModel.exists({ _id: followingId })
      ]);

      if (!followerExists) {
        throw new CustomError("Follower user not found", StatusCode.NOT_FOUND);
      }
      
      if (!followingExists) {
        throw new CustomError("User to follow not found", StatusCode.NOT_FOUND);
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
      })
        .select('_id')
        .lean()
        .exec();

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
      if (cursor && Types.ObjectId.isValid(cursor)) {
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
        .lean()
        .exec();

      const hasMore = follows.length > limit;
      const followersList = follows.slice(0, limit);

      // Check follow status for viewer in batch
      const users: UserFollowInfo[] = [];
      let followStatusMap: { [key: string]: boolean } = {};
      
      if (viewerUserId && Types.ObjectId.isValid(viewerUserId)) {
        const userIds = followersList
          .map((follow: any) => follow.follower?._id?.toString())
          .filter(Boolean);
          
        if (userIds.length > 0) {
          const viewerFollowing = await FollowModel.find({
            follower: new Types.ObjectId(viewerUserId),
            following: { $in: userIds.map(id => new Types.ObjectId(id)) }
          })
            .select('following')
            .lean()
            .exec();
          
          followStatusMap = viewerFollowing.reduce((acc, follow) => {
            acc[follow.following.toString()] = true;
            return acc;
          }, {} as { [key: string]: boolean });
        }
      }

      for (const follow of followersList) {
        const follower = follow.follower as any;
        if (!follower) continue; // Skip if follower was deleted
        
        const isFollowing = viewerUserId ? (followStatusMap[follower._id.toString()] || false) : false;

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

      // Get total count efficiently
      const totalCount = await FollowModel.countDocuments({
        following: new Types.ObjectId(userId),
      });

      return {
        users,
        hasMore,
        nextCursor: hasMore && followersList.length > 0
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
      if (cursor && Types.ObjectId.isValid(cursor)) {
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
        .lean()
        .exec();

      const hasMore = follows.length > limit;
      const followingList = follows.slice(0, limit);

      // Check follow status for viewer in batch
      const users: UserFollowInfo[] = [];
      let followStatusMap: { [key: string]: boolean } = {};
      
      if (viewerUserId && Types.ObjectId.isValid(viewerUserId)) {
        const userIds = followingList
          .map((follow: any) => follow.following?._id?.toString())
          .filter(Boolean);
          
        if (userIds.length > 0) {
          const viewerFollowing = await FollowModel.find({
            follower: new Types.ObjectId(viewerUserId),
            following: { $in: userIds.map(id => new Types.ObjectId(id)) }
          })
            .select('following')
            .lean()
            .exec();
          
          followStatusMap = viewerFollowing.reduce((acc, follow) => {
            acc[follow.following.toString()] = true;
            return acc;
          }, {} as { [key: string]: boolean });
        }
      }

      for (const follow of followingList) {
        const following = follow.following as any;
        if (!following) continue; // Skip if following user was deleted
        
        const isFollowing = viewerUserId ? (followStatusMap[following._id.toString()] || false) : false;

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

      // Get total count efficiently
      const totalCount = await FollowModel.countDocuments({
        follower: new Types.ObjectId(userId),
      });

      return {
        users,
        hasMore,
        nextCursor: hasMore && followingList.length > 0
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

      await UserModel.findByIdAndUpdate(
        userId, 
        { $inc: { followersCount: 1 } },
        { new: true, upsert: false }
      ).exec();
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

      // Use aggregation to ensure count doesn't go below 0
      await UserModel.findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              followersCount: {
                $max: [{ $subtract: [{ $ifNull: ["$followersCount", 0] }, 1] }, 0]
              }
            }
          }
        ],
        { new: true }
      ).exec();
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

      await UserModel.findByIdAndUpdate(
        userId, 
        { $inc: { followingCount: 1 } },
        { new: true, upsert: false }
      ).exec();
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

      // Use aggregation to ensure count doesn't go below 0
      await UserModel.findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              followingCount: {
                $max: [{ $subtract: [{ $ifNull: ["$followingCount", 0] }, 1] }, 0]
              }
            }
          }
        ],
        { new: true }
      ).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while decrementing following count",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // NEW COMMUNITY METHODS
  async findCommunityById(communityId: string): Promise<ICommunity | null> {
    try {
      if (!Types.ObjectId.isValid(communityId)) {
        return null;
      }
      return await CommunityModel.findById(communityId).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching community",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findCommunityByUsername(username: string): Promise<ICommunity | null> {
    try {
      if (!username || typeof username !== 'string') {
        return null;
      }
      return await CommunityModel.findOne({ 
        username: username.trim(),
        status: 'approved' 
      }).exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching community by username",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchCommunities(query: string, cursor?: string, limit: number = 20): Promise<{
    communities: ICommunity[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
  }> {
    try {
      const searchQuery: any = {
        status: 'approved',
        $or: [
          { communityName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      };

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        searchQuery._id = { $lt: new Types.ObjectId(cursor) };
      }

      const communities = await CommunityModel.find(searchQuery)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .exec();

      const hasMore = communities.length > limit;
      const resultCommunities = communities.slice(0, limit);

      // Get total count
      const totalCount = await CommunityModel.countDocuments({
        status: 'approved',
        $or: [
          { communityName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      });

      return {
        communities: resultCommunities,
        hasMore,
        nextCursor: hasMore && resultCommunities.length > 0
          ? resultCommunities[resultCommunities.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      throw new CustomError(
        "Database error while searching communities",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPopularCommunities(cursor?: string, limit: number = 20, category?: string): Promise<{
    communities: ICommunity[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
  }> {
    try {
      const query: any = { status: 'approved' };
      
      if (category && category.trim() !== '') {
        query.category = category.trim();
      }

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      // Sort by verified first, then by creation date
      const communities = await CommunityModel.find(query)
        .sort({ isVerified: -1, createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .exec();

      const hasMore = communities.length > limit;
      const resultCommunities = communities.slice(0, limit);

      // Get total count
      const totalCount = await CommunityModel.countDocuments(
        category ? { status: 'approved', category: category.trim() } : { status: 'approved' }
      );

      return {
        communities: resultCommunities,
        hasMore,
        nextCursor: hasMore && resultCommunities.length > 0
          ? resultCommunities[resultCommunities.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      throw new CustomError(
        "Database error while getting popular communities",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCommunityMemberCount(communityId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(communityId)) {
        return 0;
      }
      
      return await CommunityMemberModel.countDocuments({
        communityId: new Types.ObjectId(communityId),
        isActive: true
      });
    } catch (error) {
      console.error("Database error while getting community member count:", error);
      return 0;
    }
  }

  async checkCommunityMembership(userId: string, communityId: string): Promise<{
    isMember: boolean;
    role?: string;
    joinedAt?: Date;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(communityId)) {
        return { isMember: false };
      }

      const membership = await CommunityMemberModel.findOne({
        userId: new Types.ObjectId(userId),
        communityId: new Types.ObjectId(communityId),
        isActive: true
      }).exec();

      if (!membership) {
        return { isMember: false };
      }

      return {
        isMember: true,
        role: membership.role,
        joinedAt: membership.joinedAt
      };
    } catch (error) {
      console.error("Database error while checking community membership:", error);
      return { isMember: false };
    }
  }

  async addCommunityMember(userId: string, communityId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(communityId)) {
        throw new CustomError("Invalid user ID or community ID", StatusCode.BAD_REQUEST);
      }

      // Check if both user and community exist
      const [userExists, communityExists] = await Promise.all([
        UserModel.exists({ _id: userId }),
        CommunityModel.exists({ _id: communityId, status: 'approved' })
      ]);

      if (!userExists) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }
      
      if (!communityExists) {
        throw new CustomError("Community not found", StatusCode.NOT_FOUND);
      }

      const membership = new CommunityMemberModel({
        userId: new Types.ObjectId(userId),
        communityId: new Types.ObjectId(communityId),
        role: 'member',
        joinedAt: new Date(),
        isActive: true
      });

      await membership.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new CustomError("Already a member of this community", StatusCode.BAD_REQUEST);
      }
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while joining community",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async removeCommunityMember(userId: string, communityId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(communityId)) {
        throw new CustomError("Invalid user ID or community ID", StatusCode.BAD_REQUEST);
      }

      const result = await CommunityMemberModel.findOneAndDelete({
        userId: new Types.ObjectId(userId),
        communityId: new Types.ObjectId(communityId)
      }).exec();

      if (!result) {
        throw new CustomError("Membership not found", StatusCode.NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while leaving community",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCommunityMembers(communityId: string, cursor?: string, limit: number = 20): Promise<{
    members: ICommunityMember[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(communityId)) {
        throw new CustomError("Invalid community ID", StatusCode.BAD_REQUEST);
      }

      const query: any = { 
        communityId: new Types.ObjectId(communityId),
        isActive: true 
      };

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const members = await CommunityMemberModel.find(query)
        .populate({
          path: "userId",
          select: "_id username name profilePic community.isVerified",
          transform: (doc) => doc ? {
            _id: doc._id,
            username: doc.username,
            name: doc.name,
            profilePic: doc.profilePic,
            isVerified: doc.community?.isVerified || false
          } : null
        })
        .sort({ joinedAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean()
        .exec();

      const hasMore = members.length > limit;
      const resultMembers = members.slice(0, limit).map(member => ({
        ...member,
        user: member.userId
      }));

      // Get total count
      const totalCount = await CommunityMemberModel.countDocuments({
        communityId: new Types.ObjectId(communityId),
        isActive: true
      });

      return {
        members: resultMembers as any,
        hasMore,
        nextCursor: hasMore && resultMembers.length > 0
          ? resultMembers[resultMembers.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting community members",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchUsers(query: string, cursor?: string, limit: number = 20): Promise<{
    users: IUser[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
  }> {
    try {
      const searchQuery: any = {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
          { 'community.bio': { $regex: query, $options: 'i' } }
        ]
      };

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        searchQuery._id = { $lt: new Types.ObjectId(cursor) };
      }

      const users = await UserModel.find(searchQuery)
        .select('-password')
        .sort({ _id: -1 })
        .limit(limit + 1)
        .exec();

      const hasMore = users.length > limit;
      const resultUsers = users.slice(0, limit);

      // Get total count
      const totalCount = await UserModel.countDocuments({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
          { 'community.bio': { $regex: query, $options: 'i' } }
        ]
      });

      return {
        users: resultUsers,
        hasMore,
        nextCursor: hasMore && resultUsers.length > 0
          ? resultUsers[resultUsers.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      throw new CustomError(
        "Database error while searching users",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // NEW: My Communities Methods
  async getUserCommunities(userId: string, filter: string, sortBy: string, cursor?: string, limit: number = 20): Promise<{
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
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const query: any = { 
        userId: new Types.ObjectId(userId),
        isActive: true 
      };

      // Apply filters
      if (filter !== 'all') {
        switch (filter) {
          case 'admin':
            query.role = 'admin';
            break;
          case 'moderator':
            query.role = 'moderator';
            break;
          case 'recent':
            // Show recently joined (last 30 days)
            query.joinedAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
            break;
          case 'active':
            // Show recently active (last 7 days)
            query.lastActiveAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
            break;
        }
      }

      // Add cursor-based pagination
      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      // Determine sort order
      let sortOrder: any = { joinedAt: -1, _id: -1 }; // default: most recently joined
      switch (sortBy) {
        case 'name':
          sortOrder = { 'community.communityName': 1, _id: -1 };
          break;
        case 'members':
          sortOrder = { memberCount: -1, _id: -1 };
          break;
        case 'recent':
        default:
          sortOrder = { joinedAt: -1, _id: -1 };
          break;
      }

      const memberships = await CommunityMemberModel.find(query)
        .populate({
          path: 'communityId',
          select: '_id communityName username description category logo banner isVerified settings createdAt'
        })
        .sort(sortOrder)
        .limit(limit + 1)
        .lean()
        .exec();

      const hasMore = memberships.length > limit;
      const resultMemberships = memberships.slice(0, limit);

      // Get member counts for each community
      const communityIds = resultMemberships.map(m => (m.communityId as any)._id);
      const memberCounts = await Promise.all(
        communityIds.map(id => this.getCommunityMemberCount(id.toString()))
      );

      // Format result
      const formattedMemberships = resultMemberships.map((membership, index) => {
        const community = membership.communityId as any;
        return {
          community: {
            _id: community._id,
            communityName: community.communityName,
            username: community.username,
            description: community.description,
            category: community.category,
            logo: community.logo,
            banner: community.banner,
            isVerified: community.isVerified,
            settings: community.settings,
            createdAt: community.createdAt
          },
          role: membership.role,
          joinedAt: membership.joinedAt,
          lastActiveAt: membership.lastActiveAt || membership.joinedAt,
          unreadPosts: 0, // TODO: Implement unread posts logic
          totalPosts: membership.totalPosts || 0,
          isActive: membership.isActive,
          notifications: true, // TODO: Add notifications field to schema
          memberCount: memberCounts[index] || 0
        };
      });

      // Get total count
      const totalCount = await CommunityMemberModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      return {
        memberships: formattedMemberships as any,
        hasMore,
        nextCursor: hasMore && resultMemberships.length > 0
          ? resultMemberships[resultMemberships.length - 1]._id.toString()
          : undefined,
        totalCount
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting user communities",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserCommunityStats(userId: string): Promise<{
    total: number;
    admin: number;
    moderator: number;
    member: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const stats = await CommunityMemberModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            isActive: true
          }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        admin: 0,
        moderator: 0,
        member: 0
      };

      stats.forEach(stat => {
        result.total += stat.count;
        if (stat._id === 'admin') result.admin = stat.count;
        else if (stat._id === 'moderator') result.moderator = stat.count;
        else if (stat._id === 'member') result.member = stat.count;
      });

      return result;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting user community stats",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserCommunitiesActivity(userId: string): Promise<{
    communities: Array<{
      community: ICommunity;
      lastActiveAt: Date;
      unreadPosts: number;
      recentActivity: string;
    }>;
    totalUnreadPosts: number;
    mostActiveToday: string[];
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const memberships = await CommunityMemberModel.find({
        userId: new Types.ObjectId(userId),
        isActive: true
      })
      .populate({
        path: 'communityId',
        select: '_id communityName username logo'
      })
      .sort({ lastActiveAt: -1 })
      .limit(10)
      .lean()
      .exec();

      const communities = memberships.map(membership => ({
        community: membership.communityId as any,
        lastActiveAt: membership.lastActiveAt || membership.joinedAt,
        unreadPosts: 0, // TODO: Implement unread posts logic
        recentActivity: 'No recent activity'
      }));

      return {
        communities,
        totalUnreadPosts: 0,
        mostActiveToday: []
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while getting user communities activity",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateMemberNotifications(userId: string, communityId: string, enabled: boolean): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(communityId)) {
        throw new CustomError("Invalid user ID or community ID", StatusCode.BAD_REQUEST);
      }

      const result = await CommunityMemberModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          communityId: new Types.ObjectId(communityId),
          isActive: true
        },
        {
          $set: {
            notifications: enabled,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      return !!result;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating member notifications",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  findById(communityId: string): Promise<ICommunity | null> {
    return this.findCommunityById(communityId);
  }
}