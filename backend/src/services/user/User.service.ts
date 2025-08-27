// backend/src/services/user/User.service.ts
import { injectable, inject } from "inversify";
import bcrypt from "bcrypt";
import { IUserService } from "../../core/interfaces/services/user/IUserService";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { IUser } from "../../models/user.models";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/CustomError";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) {}

  async getProfile(userId: string): Promise<IUser | null> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new CustomError("Failed to fetch user profile", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    try {
      // Check if username is being changed and is unique
      if (data.username) {
        const existingUser = await this._userRepository.findByUsername(data.username);
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new CustomError("Username is already taken", StatusCode.BAD_REQUEST);
        }
      }

      // Remove sensitive fields
      const { password, email, isEmailVerified, role, googleId, ...updateData } = data;

      await this._userRepository.updateUser(userId, updateData);
      const updatedUser = await this._userRepository.findById(userId);
      if (!updatedUser) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }
      return updatedUser;
    } catch (error) {
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
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }

      if (user.password) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          throw new CustomError("Current password is incorrect", StatusCode.BAD_REQUEST);
        }
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this._userRepository.updateUser(userId, { password: hashedNewPassword });
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to update password", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
    try {
      const existingUser = await this._userRepository.findByUsername(username);
      if (!existingUser) {
        return true;
      }
      if (currentUserId && existingUser._id.toString() === currentUserId) {
        return true;
      }
      return false;
    } catch (error) {
      throw new CustomError("Failed to check username availability", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}