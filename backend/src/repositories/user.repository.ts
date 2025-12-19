import { injectable } from "inversify";
import { UserModel, IUser } from "../models/user.models";
import { IUserRepository } from "../core/interfaces/repositories/IUser.repository";
import { BaseRepository } from "./Base.repository";
import logger from "../utils/logger";

export interface PaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  totalPages: number;
}

@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await this.model.findOne({ email: email.toLowerCase().trim() }).exec();
    } catch (error) {
      logger.error("Error finding user by email:", error);
      throw new Error("Database error");
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    try {
      return await this.model.findOne({ username: username.trim() }).exec();
    } catch (error) {
      logger.error("Error finding user by username:", error);
      throw new Error("Database error");
    }
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    try {
      return await this.model.findOne({ googleId }).exec();
    } catch (error) {
      logger.error("Error finding user by Google ID:", error);
      throw new Error("Database error");
    }
  }

  async findByReferralCode(referralCode: string): Promise<IUser | null> {
    try {
      return await this.model.findOne({ refferalCode: referralCode.toUpperCase().trim() }).exec();
    } catch (error) {
      logger.error("Error finding user by referral code:", error);
      throw new Error("Database error");
    }
  }

  async findAllWithPagination(skip: number, limit: number, search: string): Promise<IUser[]> {
    try {
      const query = search
        ? {
            $or: [
              { username: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { name: { $regex: search, $options: 'i' } }
            ]
          }
        : {};

      return await this.model
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      logger.error("Error finding users with pagination:", error);
      throw new Error("Database error");
    }
  }

  async count(search?: string): Promise<number> {
    try {
      const query = search
        ? {
            $or: [
              { username: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { name: { $regex: search, $options: 'i' } }
            ]
          }
        : {};

      return await this.model.countDocuments(query).exec();
    } catch (error) {
      logger.error("Error counting users:", error);
      throw new Error("Database error");
    }
  }

  async updateLastLogin(id: string): Promise<IUser | null> {
    try {
      return await this.model.findByIdAndUpdate(
        id, 
        { lastLogin: new Date() }, 
        { new: true }
      ).exec();
    } catch (error) {
      logger.error("Error updating last login:", error);
      throw new Error("Database error");
    }
  }

  async incrementTokenVersion(id: string): Promise<IUser | null> {
    try {
      return await this.model.findByIdAndUpdate(
        id,
        { $inc: { tokenVersion: 1 } },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error("Error incrementing token version:", error);
      throw new Error("Database error");
    }
  }

  async createUser(data: {
    googleId?: string;
    email: string;
    name: string;
    role: string;
  }): Promise<IUser> {
    try {
      const user = new this.model({
        googleId: data.googleId,
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        role: data.role,
      });
      return await user.save();
    } catch (error) {
      logger.error("Error creating user:", error);
      throw new Error("Database error");
    }
  }
}