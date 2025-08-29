import { UserModel, IUser } from "../models/user.models";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";
import { BaseRepository } from "./base.repository";
import mongoose from "mongoose";

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  async createUser(data: Partial<IUser>) {
    console.log("UserRepository: Creating user with data:", data);
    return await UserModel.create(data);
  }

  async findByEmail(email: string) {
    console.log("UserRepository: Finding user by email:", email);
    return await UserModel.findOne({ email }).exec();
  }

  async findByUsername(username: string) {
    console.log("UserRepository: Finding user by username:", username);
    return await UserModel.findOne({ username }).exec();
  }

  async findByGoogleId(googleId: string) {
    console.log("UserRepository: Finding user by Google ID:", googleId);
    return await UserModel.findOne({ googleId }).exec();
  }

  async findAll(skip: number, limit: number) {
    console.log("UserRepository: Finding all users with skip:", skip, "limit:", limit);
    return await UserModel.find()
      .skip(skip)
      .limit(limit)
      .select("name email phone isEmailVerified isBanned role username followersCount followingCount dailyCheckin.streak totalPoints profilePic createdAt");
  }

  async findUsers(page: number, limit: number, search: string) {
    console.log("UserRepository: Finding users with page:", page, "limit:", limit, "search:", search);
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name email phone username role isEmailVerified isBanned createdAt")
        .lean(),
      UserModel.countDocuments(query)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async count() {
    console.log("UserRepository: Counting users");
    return await UserModel.countDocuments();
  }

  async updateUser(id: string, update: Partial<IUser>) {
    console.log("UserRepository: Updating user:", id, "with data:", update);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    const result = await UserModel.findByIdAndUpdate(
      id, 
      { $set: update }, 
      { new: true, runValidators: true }
    ).select("-password");
    
    console.log("UserRepository: Update result:", result ? "Success" : "Failed");
    return result;
  }

  async updateStatus(id: string, updateData: Partial<IUser>) {
    console.log("UserRepository: Updating status for user:", id, "with data:", updateData);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findById(id: string) {
    console.log("UserRepository: Finding user by ID:", id);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("UserRepository: Invalid ObjectId format:", id);
      return null;
    }

    const user = await UserModel.findById(id).select("-password").lean();
    console.log("UserRepository: User found:", user ? "Yes" : "No");
    return user;
  }
}