// backend/src/services/user/User.service.ts
import { injectable, inject } from "inversify";
import bcrypt from "bcrypt";
import { IUserService } from "../../core/interfaces/services/user/IUser.service";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import { IUser } from "../../models/user.models";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) {}

  async getProfile(userId: string): Promise<IUser | null> {
    try {
      
      
      if (!userId) {
        throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
      }

      const user = await this._userRepository.findById(userId);
      
      
      if (!user) {
        throw new CustomError("User profile not found", StatusCode.NOT_FOUND);
      }

      const profileData = {
        _id: user._id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        phone: user.phone || "",
        refferalCode: user.refferalCode || "",
        refferedBy: user.refferedBy || "",
        profilePic: user.profilePic || "",
        role: user.role,
        totalPoints: user.totalPoints || 0,
        isBlocked: user.isBlocked || false,
        isBanned: user.isBanned || false,
        tokenVersion: user.tokenVersion || 0,
        isEmailVerified: user.isEmailVerified || false,
        isGoogleUser: user.isGoogleUser || false,
        dailyCheckin: {
          lastCheckIn: user.dailyCheckin?.lastCheckIn || null,
          streak: user.dailyCheckin?.streak || 0,
        },
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      
      return profileData as IUser;
    } catch (error) {
      console.error("UserService: Get profile error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to fetch user profile", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    try {
      
      
      if (!userId) {
        throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
      }

      if (data.username) {
        const existingUser = await this._userRepository.findByUsername(data.username);
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new CustomError("Username is already taken", StatusCode.BAD_REQUEST);
        }
      }

      const { password, email, isEmailVerified, role, googleId, tokenVersion, ...updateData } = data;

      
      
      await this._userRepository.update(userId, updateData);
      
      const updatedUser = await this._userRepository.findById(userId);
      
      if (!updatedUser) {
        throw new CustomError("User profile not found after update", StatusCode.NOT_FOUND);
      }

      
      return updatedUser;
    } catch (error) {
      console.error("UserService: Update profile error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to update user profile", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      
      
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError("User profile not found", StatusCode.NOT_FOUND);
      }

      if (user.password) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          throw new CustomError("Current password is incorrect", StatusCode.BAD_REQUEST);
        }
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this._userRepository.update(userId, { password: hashedNewPassword });
      
      
    } catch (error) {
      console.error("UserService: Update password error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to update password", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
    try {
      
      
      if (!username || username.trim() === "") {
        throw new CustomError("Username cannot be empty", StatusCode.BAD_REQUEST);
      }

      const existingUser = await this._userRepository.findByUsername(username.trim());
      
      if (!existingUser) {
        
        return true;
      }

      if (currentUserId && existingUser._id.toString() === currentUserId) {
        
        return true;
      }

      
      return false;
    } catch (error) {
      console.error("UserService: Check username availability error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to check username availability", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}