import { injectable } from "inversify";
import { ICommunityRepository } from "../core/interfaces/repositories/ICommunityRepository";
import { IUser, UserModel } from "../models/user.models";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";
import { Types } from "mongoose";

@injectable()
export class CommunityRepository implements ICommunityRepository {
    async findUserById(userId: string): Promise<IUser | null> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                return null;
            }
            return await UserModel.findById(userId).select('-password').exec();
        } catch (error) {
            throw new CustomError("Database error while fetching user", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async findUserByUsername(username: string): Promise<IUser | null> {
        try {
            return await UserModel.findOne({ username }).select('-password').exec();
        } catch (error) {
            throw new CustomError("Database error while fetching user by username", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCommunityProfile(userId: string, data: Partial<IUser['community']>): Promise<IUser | null> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
            }

            const updateData: any = {};
            Object.keys(data).forEach(key => {
                updateData[`community.${key}`] = (data as any)[key];
            });

            return await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password').exec();
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while updating community profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async incrementPostsCount(userId: string): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
            }

            await UserModel.findByIdAndUpdate(
                userId,
                { $inc: { 'community.postsCount': 1 } }
            ).exec();
        } catch (error) {
            throw new CustomError("Database error while incrementing posts count", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async incrementLikesReceived(userId: string, count: number = 1): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
            }

            await UserModel.findByIdAndUpdate(
                userId,
                { $inc: { 'community.likesReceived': count } }
            ).exec();
        } catch (error) {
            throw new CustomError("Database error while incrementing likes received", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateFollowersCount(userId: string, count: number): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
            }

            await UserModel.findByIdAndUpdate(
                userId,
                { $set: { followersCount: count } }
            ).exec();
        } catch (error) {
            throw new CustomError("Database error while updating followers count", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateFollowingCount(userId: string, count: number): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
            }

            await UserModel.findByIdAndUpdate(
                userId,
                { $set: { followingCount: count } }
            ).exec();
        } catch (error) {
            throw new CustomError("Database error while updating following count", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}